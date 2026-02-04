/// <reference path="./deno.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type AlterarLetraRequest = {
  pedidoId: string;
  sugestoes: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function getEnv(name: string, required = true): string {
  const v = Deno.env.get(name);
  if (!v && required) throw new Error(`Missing env var: ${name}`);
  return v || "";
}

function extractOutputText(resp: any): string {
  if (!resp) return "";
  if (typeof resp.output_text === "string" && resp.output_text.trim()) {
    return resp.output_text.trim();
  }

  try {
    const out = resp.output ?? [];
    const chunks: string[] = [];
    for (const item of out) {
      const content = item?.content ?? [];
      for (const c of content) {
        if (c?.type === "output_text" && typeof c?.text === "string") chunks.push(c.text);
        if (c?.type === "text" && typeof c?.text === "string") chunks.push(c.text);
      }
    }
    return chunks.join("\n").trim();
  } catch {
    return "";
  }
}

function parseJsonSafely(outText: string) {
  try {
    return JSON.parse(outText);
  } catch {
    const start = outText.indexOf("{");
    const end = outText.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const sliced = outText.slice(start, end + 1);
      return JSON.parse(sliced);
    }
    throw new Error("Model output was not valid JSON");
  }
}

async function callOpenAI(systemPrompt: string, userPrompt: string) {
  const OPENAI_API_KEY = getEnv("OPENAI_API_KEY", true);
  const OPENAI_MODEL = getEnv("OPENAI_MODEL", false) || "gpt-4o-mini";
  const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

  const body = {
    model: OPENAI_MODEL,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7, // ← Reduzido para 0.7 (mais consistente em edições)
  };

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const outText = extractOutputText(data);
  if (!outText) throw new Error("OpenAI response contained no output text");
  return { data, outText };
}

// ============================================
// FUNÇÃO NOVA: Comparar e gerar changelog detalhado
// ============================================

function generateChangelogDetailed(original: string, modified: string): string {
  // Análise simples: contar mudanças por linha
  const origLines = original.split("\n");
  const modLines = modified.split("\n");
  
  let changedLines = 0;
  const maxLines = Math.max(origLines.length, modLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    if ((origLines[i] || "") !== (modLines[i] || "")) {
      changedLines++;
    }
  }
  
  const percentChanged = Math.round((changedLines / maxLines) * 100);
  
  if (percentChanged < 15) return "Alteração mínima: apenas pequenos ajustes foram feitos.";
  if (percentChanged < 40) return "Alteração moderada: partes específicas foram modificadas mantendo a estrutura.";
  if (percentChanged < 70) return "Alteração significativa: vários trechos foram reescritos.";
  return "Alteração completa: praticamente toda a letra foi reescrita.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

    const { pedidoId, sugestoes } = (await req.json()) as AlterarLetraRequest;
    
    if (!pedidoId) return jsonResponse({ error: "Missing pedidoId" }, 400);
    if (!sugestoes || sugestoes.trim().length < 10) {
      return jsonResponse({ error: "Sugestões muito curtas. Descreva o que quer mudar." }, 400);
    }

    const SUPABASE_URL = getEnv("SUPABASE_URL", true);
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY", true);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Buscar pedido
    console.log("🔍 Buscando pedido:", pedidoId);
    
    const { data: order, error: selErr } = await supabaseAdmin
      .from("musicas_pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (selErr || !order) {
      console.error("❌ Erro ao buscar pedido:", selErr);
      return jsonResponse({ error: "Pedido não encontrado", detail: selErr?.message }, 404);
    }

    console.log("✅ Pedido encontrado:", order.id);
    console.log("📊 Status:", order.status);

    // 2) Verificar se já usou a alteração
    if (order.alteracao_usada === true) {
      console.warn("⚠️ Alteração já foi usada");
      return jsonResponse({ 
        error: "Você já usou sua alteração única. Não é possível fazer novas modificações." 
      }, 400);
    }

    // 3) ✅ OBTER OU CRIAR versao_original
    let versaoOriginal = order.versao_original;

    if (!versaoOriginal) {
      console.warn("⚠️ versao_original não existe, criando a partir dos dados atuais...");
      
      const aiMetadata = order.ai_metadata || {};
      const sunoPayload = aiMetadata.suno_payload || {};
      
      versaoOriginal = {
        title: order.title,
        customer_lyrics: order.lyrics,
        style: sunoPayload.style || "acoustic, heartfelt",
        suno_payload: {
          title: order.title,
          style: sunoPayload.style || "acoustic, heartfelt",
          lyrics: sunoPayload.lyrics || order.lyrics,
          negative_style: sunoPayload.negative_style || ""
        },
        highlights: aiMetadata.highlights || {}
      };

      // ✅ Salvar versao_original no banco
      console.log("💾 Salvando versao_original criada...");
      const { error: updateOrigErr } = await supabaseAdmin
        .from("musicas_pedidos")
        .update({ versao_original: versaoOriginal })
        .eq("id", pedidoId);

      if (updateOrigErr) {
        console.error("❌ Erro ao salvar versao_original:", updateOrigErr);
      } else {
        console.log("✅ versao_original salva com sucesso");
      }
    }

    // ✅ Validar se tem letra
    const letraOriginal = versaoOriginal.customer_lyrics || versaoOriginal.lyrics || order.lyrics;

    if (!letraOriginal || letraOriginal.trim().length < 50) {
      console.error("❌ Letra original muito curta ou inexistente");
      return jsonResponse({ 
        error: "Letra original muito curta ou inexistente. Não é possível fazer alterações.",
        versao_original: versaoOriginal,
        order_lyrics_length: order.lyrics?.length || 0
      }, 400);
    }

    console.log("✅ Letra original validada:", letraOriginal.substring(0, 100) + "...");
    console.log("💬 Sugestões recebidas:", sugestoes.substring(0, 100) + "...");

    // 4) CRIAR PROMPTS OTIMIZADOS PARA ALTERAÇÃO
    
    const systemPrompt = `
Você é um compositor e revisor musical especializado em ajustar letras baseando-se em feedback direto do cliente.

═══════════════════════════════════════════════════════════════════

OBJETIVO:
- Você receberá uma letra COMPLETA e feedback específico.
- Modifique APENAS o que foi solicitado pelo cliente.
- Mantenha TUDO que não foi mencionado: tom, estrutura, estilo, outros versos.
- NÃO adicione elementos não pedidos; seja conservador nas mudanças.

═══════════════════════════════════════════════════════════════════

PRINCÍPIOS OBRIGATÓRIOS:

1. RESPEITE A ESTRUTURA ORIGINAL
   - Se não foi pedido para mudar [Verse], [Chorus], etc., MANTENHA igual.
   - Se pediu para "melhorar o refrão", mude APENAS o refrão.
   - Se pediu para "adicionar uma ponte", adicione mas mantenha tudo mais.

2. MANTENHA COERÊNCIA MUSICAL
   - Métrica: se o verso original tem 4 linhas de 10 sílabas, mantenha isso.
   - Rimas: se usava AABB, mantenha AABB (ou a estrutura original).
   - Ritmo: a mudança deve "caber" no mesmo tempo de música.

3. PRESERVE ELEMENTOS CRÍTICOS
   - Nome do destinatário (a menos que explicitamente pedido para mudar).
   - Referências específicas mencionadas nas respostas originais (datas, lugares, detalhes).
   - Tom emocional geral (a menos que o cliente tenha pedido mudar para mais alegre/triste/etc).

4. QUALIDADE MÍNIMA
   - Cada linha deve ser cantável e natural.
   - Rimas devem ser perfeitas ou muito próximas (não forçadas).
   - Evite palavras muito estranhas ou fora do contexto.

5. SE A SUGESTÃO FOR CONTRADITÓRIA OU GENÉRICA
   - Exemplo: "mude para mais emocionante mas mantenha alegre" → interprete como "adicione contraste emocional"
   - Exemplo: "mude tudo" → mude tom, alguns versos-chave, mas mantenha estrutura e nome
   - Se não souber exatamente o que fazer, mantenha o máximo possível.

═══════════════════════════════════════════════════════════════════

TAGS E CUES A PRESERVAR:
- [Verse], [Chorus], [Bridge], [Outro] → MANTENHA as tags
- Cues de estilo: (conversational), (soft harmonies), (powerful), etc → MANTENHA se não foi solicitado mudar
- Anotações textuais: (verso 1), (refrão 1), etc → MANTENHA

═══════════════════════════════════════════════════════════════════

PROCESSO MENTAL:
1. Leia a letra original COMPLETA com atenção.
2. Identifique qual seção o cliente quer mudar (refrão? verso? ponte? tom geral?).
3. Faça a mudança MÍNIMA necessária para atender o pedido.
4. Verifique: a métrica continua? As rimas funcionam? Soa natural?
5. MANTENHA TUDO MAIS igual.

═══════════════════════════════════════════════════════════════════

FORMATO DE SAÍDA (JSON):
{
  "title": "string - Mantenha original, apenas ajuste se necessário",
  "customer_lyrics": "string - Letra limpa, modificada conforme solicitado",
  "suno_payload": {
    "title": "string - Título (pode ser igual ou variação)",
    "style": "string - MANTENHA O ORIGINAL, não mude",
    "lyrics": "string - Letra com [Verse], [Chorus], etc, modificada",
    "negative_style": "string - MANTENHA O ORIGINAL"
  },
  "highlights": {
    "hook": "string - Frase principal do refrão (novo ou original)",
    "mentioned_details": ["array - Detalhes que foram preservados ou ajustados"]
  },
  "changelog": "string - Breve explicação (1-3 frases) das mudanças feitas e do que foi preservado"
}

═══════════════════════════════════════════════════════════════════
`.trim();

    const userPrompt = `
LETRA ORIGINAL:

Título: ${versaoOriginal.title || order.title}
Estilo Musical: ${versaoOriginal.style || versaoOriginal.suno_payload?.style || "não especificado"}


VERSÃO LIMPA (customer_lyrics):
${letraOriginal}


${versaoOriginal.suno_payload?.lyrics ? `VERSÃO TÉCNICA (com tags [Verse], [Chorus], etc):
${versaoOriginal.suno_payload.lyrics}

` : ''}

═══════════════════════════════════════════════════════════════════

FEEDBACK DO CLIENTE PARA ALTERAR:

${sugestoes}

═══════════════════════════════════════════════════════════════════

IMPORTANTE:
- Modifique APENAS o que foi pedido.
- Mantenha a estrutura, métrica e rimas existentes onde não foi solicitado mudar.
- Preserve todas as referências específicas (nomes, datas, lugares) a menos que explicitamente pedido para mudar.
- A letra modificada deve soar como uma evolução natural da original, não como uma reescrita completa.
- Mantenha o estilo musical (não mude o "style").

Responda com APENAS o JSON especificado, sem texto antes ou depois.
`.trim();

    console.log("🤖 Chamando ChatGPT com prompts otimizados...");

    // 5) Chamar OpenAI
    const { data: openaiRaw, outText } = await callOpenAI(systemPrompt, userPrompt);

    console.log("✅ OpenAI respondeu, parseando JSON...");

    // 6) Parse e validar
    const modelJson = parseJsonSafely(outText);
    
    if (!modelJson.customer_lyrics || !modelJson.suno_payload) {
      console.error("❌ JSON inválido do ChatGPT:", modelJson);
      throw new Error("ChatGPT retornou JSON inválido");
    }

    console.log("✅ JSON validado");

    // ✅ NOVO: Gerar changelog detalhado comparando versões
    const changelogAutomatico = generateChangelogDetailed(letraOriginal, modelJson.customer_lyrics);
    const changelogFinal = modelJson.changelog || changelogAutomatico;

    // 7) Criar versão modificada
    const versaoModificada = {
      title: modelJson.title,
      customer_lyrics: modelJson.customer_lyrics,
      style: versaoOriginal.style, // ← SEMPRE MANTÉM O ORIGINAL
      suno_payload: {
        title: modelJson.suno_payload.title,
        style: versaoOriginal.suno_payload?.style || modelJson.suno_payload.style, // ← PRESERVA ORIGINAL
        lyrics: modelJson.suno_payload.lyrics,
        negative_style: versaoOriginal.suno_payload?.negative_style || modelJson.suno_payload.negative_style
      },
      highlights: modelJson.highlights,
      changelog: changelogFinal,
    };

    console.log("💾 Salvando versão modificada no banco...");

    // 8) Atualizar banco
    const { error: updErr } = await supabaseAdmin
      .from("musicas_pedidos")
      .update({
        versao_modificada: versaoModificada,
        alteracao_solicitada: sugestoes,
        alteracao_usada: true,
        status: "aguardando_aprovacao",
      })
      .eq("id", pedidoId);

    if (updErr) {
      console.error("❌ Erro ao salvar no banco:", updErr);
      throw updErr;
    }

    console.log("✅ Versão modificada salva com sucesso!");

    return jsonResponse({
      success: true,
      pedidoId,
      versao_modificada: versaoModificada,
      mensagem: "✅ Versão modificada criada! Compare as duas versões e escolha sua favorita.",
    });

  } catch (e) {
    console.error("=" .repeat(80));
    console.error("❌ ERRO NA EDGE FUNCTION:");
    console.error("Message:", (e as Error).message);
    console.error("Stack:", (e as Error).stack);
    console.error("=" .repeat(80));
    return jsonResponse({ error: (e as Error).message || "Unknown error" }, 500);
  }
});
