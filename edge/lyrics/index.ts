/// <reference path="./deno.d.ts" />


import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { questionIntentMap } from "./intentMap.ts";

type GenerateLyricsRequest = {
  pedidoId: string;
};


// ✅ CORS (necessário para chamar do GitHub Pages / qualquer front)
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


function validateModelJson(obj: any) {
  const errors: string[] = [];

  if (!obj || typeof obj !== "object") errors.push("Output is not an object");
  if (!obj?.title || typeof obj.title !== "string") errors.push("Missing/invalid 'title'");
  if (!obj?.customer_lyrics || typeof obj.customer_lyrics !== "string") errors.push("Missing/invalid 'customer_lyrics'");

  if (!obj?.suno_payload || typeof obj.suno_payload !== "object") {
    errors.push("Missing/invalid 'suno_payload'");
  } else {
    const sp = obj.suno_payload;

    if (!sp.title || typeof sp.title !== "string") errors.push("Missing/invalid 'suno_payload.title'");
    if (!sp.style || typeof sp.style !== "string") errors.push("Missing/invalid 'suno_payload.style'");
    if (!sp.prompt || typeof sp.prompt !== "string") errors.push("Missing/invalid 'suno_payload.prompt'");

    if (sp.negativeTags && typeof sp.negativeTags !== "string") errors.push("Invalid 'suno_payload.negativeTags'");

    // limites
    if (typeof sp.title === "string" && sp.title.length > 100) errors.push("suno_payload.title too long (>100)");
    if (typeof sp.style === "string" && sp.style.length > 1000) errors.push("suno_payload.style too long (>1000)");
    if (typeof sp.prompt === "string" && sp.prompt.length > 5000) errors.push("suno_payload.prompt too long (>5000)");
    if (typeof sp.negativeTags === "string" && sp.negativeTags.length > 1000) errors.push("suno_payload.negativeTags too long (>1000)");

    // tags mínimas
    if (typeof sp.prompt === "string") {

      const hasVerse = /\[Verse(?:\s|\(|\])/.test(sp.prompt);
      const hasChorus = /\[Chorus(?:\s|\(|\])/.test(sp.prompt);
      const hasBridge = /\[Bridge(?:\s|\(|\])/.test(sp.prompt);
      const hasOutro = /\[Outro(?:\s|\(|\])/.test(sp.prompt);

      if (!hasVerse) errors.push("suno_payload.prompt missing [Verse]");
      if (!hasChorus) errors.push("suno_payload.prompt missing [Chorus]");
    }
  }

  if (!obj?.highlights || typeof obj.highlights !== "object") {
    errors.push("Missing/invalid 'highlights'");
  } else {
    if (!obj.highlights.hook || typeof obj.highlights.hook !== "string") errors.push("Missing/invalid 'highlights.hook'");
    if (!Array.isArray(obj.highlights.mentioned_details)) errors.push("Missing/invalid 'highlights.mentioned_details'");
  }

  const lyr = obj?.customer_lyrics || "";
  if (typeof lyr === "string" && lyr.length < 50) errors.push("customer_lyrics too short");
  if (typeof lyr === "string" && lyr.length > 6000) errors.push("customer_lyrics too long");

  return errors;
}



function buildPrompts(orderRow: any) {
  const payload = orderRow?.payload ?? {};
  const answers = payload?.answers ?? {};
  const asked = payload?.asked ?? [];

  // ✅ Buscar idioma
  const language =
    answers?.lyricDetails?.language ||
    payload?.language ||
    "pt_br";

  // ============================================
  // MAPEAR IDIOMA PARA NOME LEGÍVEL
  // ============================================

  const languageName = {
    pt_br: "Português Brasileiro",
    en: "English",
    es: "Español",
    it: "Italiano",
  }[language] || "Português Brasileiro";

  // ============================================
  // CONVERTER asked[] EM FORMATO LEGÍVEL
  // ============================================

  const questionsAndAnswers = asked.map((item) => ({
    pergunta: item.question,
    resposta: item.answerValue,
    label: item.answerLabel,
    campo: item.fieldName,
  }));

  // Montar texto das perguntas e respostas
const questionsText = questionsAndAnswers
  .map((qa) => {
    const intent = questionIntentMap[qa.campo];
    const intentBlock = intent
      ? `INTENÇÃO DA PERGUNTA (para interpretação musical/poética):\n${intent}`
      : ""; // sem intent definido, não imprime

    return [
      `P: ${qa.pergunta}`,
      intentBlock ? intentBlock : null,
      `R: ${qa.label || qa.resposta}`,
      `CAMPO: ${qa.campo}`, // opcional (recomendo manter por enquanto p/ debug semântico)
    ]
      .filter(Boolean)
      .join("\n");
  })
  .join("\n\n---\n\n");

  // ============================================
  // EXTRAIR TEMA PARA INSTRUÇÕES ESPECÍFICAS
  // ============================================

  const theme = answers?.ai_metadata?.themeId || "unknown";

  const themeInstructions = {
    birthday: "Esta é uma música de ANIVERSÁRIO. O tom deve ser alegre, celebrativo, com leveza e gratidão. Pode incluir momentos engraçados e nostálgicos.",
    love_declaration: "Esta é uma DECLARAÇÃO DE AMOR. O tom deve ser profundamente emocional, vulnerável e sincero. Foque em sentimentos autênticos e detalhes do relacionamento.",
    proposal: "Este é um PEDIDO DE CASAMENTO. O tom deve ser épico, definitivo, esperançoso e altamente pessoal. A música deve refletir compromisso e futuro compartilhado.",
    pregnancy_announcement: "Este é um ANÚNCIO DE GRAVIDEZ. O tom deve ser alegre, cheio de esperança e comemoração. Pode incluir nostalgia sobre o passado e sonhos para o futuro.",
    birth_child: "Esta é uma música para NASCIMENTO DE FILHO(A). O tom deve ser amoroso, protetor, cheio de gratidão e maravilhamento. Celebre a nova vida e a responsabilidade.",
    birth_grandchild: "Esta é uma música para NASCIMENTO DE NETO(A). O tom deve combinar alegria, sabedoria e legado familiar. Conecte gerações.",
    tribute: "Esta é uma HOMENAGEM. O tom deve ser respeitoso, amoroso e celebrativo das qualidades da pessoa. Pode incluir saudade se for póstuma, ou admiração se em vida.",
    friendship: "Esta é uma música de AMIZADE. O tom deve ser genuíno, leve, celebrativo. Valorize os momentos compartilhados e a importância da pessoa na vida do cliente.",
    corporate: "Esta é uma música CORPORATIVA/INSTITUCIONAL. O tom deve ser profissional, inspirador e memorável. Foque em valores, missão e impacto positivo.",
    prayer: "Esta é uma ORAÇÃO/MÚSICA ESPIRITUAL. O tom deve ser reverente, esperançoso, contemplativo e pacífico. Evite clichês religiosos; foque em sinceridade.",
    other: "Esta é uma música CUSTOMIZADA. Adapte o tom às respostas específicas fornecidas pelo cliente.",
  }[theme] || "Esta é uma música customizada. Adapte o tom às respostas do cliente.";

  // ============================================
  // SYSTEM PROMPT - COMPLETO E OTIMIZADO
  // ============================================

  const systemPrompt = `
Você é um compositor profissional, letrista e produtor musical com 20+ anos de experiência em composições altamente personalizadas.

═══════════════════════════════════════════════════════════════════

SAÍDA OBRIGATÓRIA:
- Responda EXCLUSIVAMENTE com JSON válido, sem nenhum texto antes ou depois.
- Sem Markdown, comentários ou explicações fora do JSON.
- JSON deve ser perfeitamente formatado, sem vírgulas extras ou chaves faltando.

═══════════════════════════════════════════════════════════════════

OBJETIVO:
Criar uma letra de música original, emocionalmente devastadora e absolutamente específica para essa pessoa nesse momento.
Além da letra, gerar payload técnico pronto para produção.

═══════════════════════════════════════════════════════════════════

REGRA DE CONSISTÊNCIA (OBRIGATÓRIA):
- Existe APENAS UMA letra base: customer_lyrics.
- suno_payload.prompt NÃO deve ser reescrito criativamente.
- O prompt do Suno deve ser uma TRANSPOSIÇÃO de customer_lyrics,
  apenas trocando rótulos por tags [Verse], [Chorus], [Bridge], [Outro].
- Não invente, não remova e não altere versos entre os campos.

═══════════════════════════════════════════════════════════════════

IDIOMA:
- Toda a letra (customer_lyrics e suno_payload.lyrics) DEVE ser em: ${languageName}
- Nenhuma mistura de idiomas, a menos que explicitamente pedido.
- Escolha vocabulário natural, cantável e apropriado para a faixa etária/contexto do destinatário.

═══════════════════════════════════════════════════════════════════

CONTEXTO EMOCIONAL:
Caso não esteja especificado nas respostas do payload, leve as considerações abaixo como direcionamento.
${themeInstructions}

═══════════════════════════════════════════════════════════════════

ANTI-GENÉRICO (REGRAS NÃO-NEGOCIÁVEIS):
1. Evite ao máximo usar frases prontas que vieram das respostas do payload na letra final.
2. Evite usar datas específicas na letra final, se precisar dar ordem cronológica na letra, oriente através de palavras ou expressões que organizem o tempo.
3. Use o máximo de detalhes específicos das respostas do cliente que forem possíveis. Nada genérico.
4. Inclua, quando existentes no payload, imagens/cenas concretas e distintas, lembrando de fazer com palavras que se encaixem na música:
   - PASSADO (memória, história compartilhada, origem)
   - PRESENTE (momento atual, situação específica)
   - FUTURO (esperança, sonho, promessa, destino)
5. Quando pertinente ao tema e à organização da música, use o nome do destinatário em momentos-chave:
6. PROÍBIDO usar frases vazias. Exemplos PROIBIDOS:
7. A letra deve levar a mensagem sem ser genérica, levando o sentimento ou situação que a pessoa está tentando passar, mas sem ficar parafraseando o payload.
8. Se houver palavras em língua diferente da escolhida e que possam gerar defeitos na geração do audio, evite, use metáforas ou aponte de maneira indireta.

═══════════════════════════════════════════════════════════════════

ESTRUTURA E DURAÇÃO:
- A música deve ter extensão equivalente a PELO MENOS 3 minutos quando cantada/produzida.
- NÃO é permitido ficar menor que 3 minutos através de repetições artificiais ou seções vazias.
- Estrutura FLEXÍVEL, não engessada.
- Mantenha consistência rítmica dentro da estrutura escolhida.
- Não force seções que não fazem sentido para o gênero.

═══════════════════════════════════════════════════════════════════

CUSTOMER_LYRICS (o que será apresentado ao cliente):
- Letra limpa, sem nenhuma instrução técnica ou tag.
- Formatação clara: use quebras de linha entre seções (Verso 1 / Refrão / Verso 2, etc).
- Bonita, fácil de ler, pronta para publicar.
- Totalmente natural e cantável.

═══════════════════════════════════════════════════════════════════

SUNO_PAYLOAD.PROMPT (para produção Suno / customMode)
Este campo será enviado como prompt para o Suno.
Deve conter EXCLUSIVAMENTE a letra cantável.
Use tags estruturais exatamente: [Verse], [Chorus], [Bridge], [Outro].
Pode adicionar cues curtos entre parênteses dentro da tag: Exemplo: [Verse (suave) (emocional)].
Máximo 2 cues por seção.
Limite duro: prompt ≤ 5000 caracteres (ideal ≤ 4800).
Se estiver perto do limite: encurte versos mantendo refrões, e nunca corte no meio de uma seção.

═══════════════════════════════════════════════════════════════════

LIMITES (NÃO QUEBRAR):
- suno_payload.title: <= 100 caracteres
- suno_payload.style: <= 1000 caracteres
- suno_payload.prompt: <= 5000 caracteres (alvo <= 4800)
- negativeTags: <= 1000 caracteres

Se qualquer campo exceder limite:
1) reescreva/encurte mantendo os detalhes obrigatórios,
2) preserve refrão e arco narrativo,
3) nunca trunque no meio de uma palavra ou no meio de uma seção.

═══════════════════════════════════════════════════════════════════

SUNO_PAYLOAD.STYLE (um dos pontos críticos):
- Uma única frase em INGLÊS, descritiva e profissional.
- DEVE incluir:
  • Gênero/subgênero (ex: "modern pop ballad", "acoustic sertanejo", "epic rock")
  • Atmosfera (ex: warm, nostalgic, celebratory, intimate, powerful, melancholic, hopeful, epic)
  • Instrumentação principal (ex: acoustic guitar, piano, strings, drums, pads, horns, etc)
  • Tipo/estilo vocal (ex: soft male vocals, powerful female vocals, intimate duet, anthemic chorus, etc)
  • Tempo/andamento inferido (ex: slow, midtempo, uptempo, energetic, contemplative)
  • Direção de arranjo / dinâmica (ex: minimal arrangement, gentle build, layered progression, dynamic chorus lift)
  • Foco de produção / mix (ex: vocals upfront, warm reverb, clean acoustic mix, cinematic depth, lo-fi texture)
  • Impacto emocional específico (ex: introspective, uplifting, cathartic, tender, reflective, reassuring)
  • Comportamento do refrão / gancho (ex: memorable hook, subtle recurring motif, emotional chorus emphasis)
  • Densidade sonora (ex: sparse and intimate, gradually richer, full and immersive)

═══════════════════════════════════════════════════════════════════

SUNO_PAYLOAD.NEGATIVETAGS:
- Uma única string em inglês, separada por vírgulas.
- Deve converter o campo "lyricDetails.avoid" + riscos típicos do tema em itens concretos.
- Ex.: "sad breakup, angry tone, complaint lyrics, heavy metal, screaming, aggressive drums"
- Não coloque frases longas, use keywords.

═══════════════════════════════════════════════════════════════════

PESOS (preencher sempre):
- styleWeight: 0.70 a 0.90 (mais alto = respeita mais o estilo)
- weirdnessConstraint: 0.10 a 0.35 (oração/MPB pede baixo)
- audioWeight: 0.00 se não houver áudio de referência

═══════════════════════════════════════════════════════════════════

QUALIDADE TÉCNICA:
- Métrica consistente: versos devem ter comprimento similar entre eles.
- Rimas naturais no idioma escolhido (não force rimas forçadas).
- Evite palavras muito difíceis em sequência; facilite a dicção do cantor.
- Nenhuma repetição de verso inteiro (exceto refrão, que pode repetir).
- Se usar repetição, seja inteligente: varie ligeiramente a segunda/terceira vez (técnica de build).

═══════════════════════════════════════════════════════════════════

TOM E SENSIBILIDADE:
1) Respeite sempre as respostas do cliente, mas em caso falte informação, abaixo um direcionamento:
- Músicas de ANIVERSÁRIO, NASCIMENTO, ANÚNCIO: podem ser alegres, com leveza e até humor sutil.
- Músicas de DECLARAÇÃO, PROPOSTA: profunda sinceridade, vulnerabilidade.
- Músicas de HOMENAGEM, ORAÇÃO: respeito absoluto. Evite clichês religiosos em orações; foque em sinceridade.
- Músicas CORPORATIVAS: inspiradora, memorável, alinhada com valores.
- Se houver tema sensível (morte, doença, trauma), trate com delicadeza e esperança, nunca com simplismo.

═══════════════════════════════════════════════════════════════════

PROVA DE BRIEFING:
- Você DEVE preencher \`highlights.mentioned_details\` com uma lista clara de quais detalhes do briefing você incorporou.
- Para cada detalhe, seja específico: não escreva "usou nome", escreva "usou nome 'Maria' no verso 2 ao falar do encontro".
- Se tiver perguntas com respostas vagas ("não sei", "tanto faz"), priorize as respostas ricas em detalhe.
- Array \`mentioned_details\` nunca deve estar vazio se houver detalhes no briefing.

═══════════════════════════════════════════════════════════════════

CONTRATO DE SAÍDA (JSON):
{
  "title": "string - Título criativo e memorável, máx 8 palavras",
  "customer_lyrics": "string - Letra limpa, formatada, pronta para publicar",
  "suno_payload": {
    "model": "V5",
    "customMode": true,
    "instrumental": false,

    "title": "string - <= 100 chars",
    "style": "string - <= 1000 chars, UMA frase em inglês descrevendo gênero/atmosfera/instrumentos/vocal/tempo",
    "prompt": "string - LETRA com tags [Verse]/[Chorus]/[Bridge]/[Outro] e cues curtos, <= 5000 chars (ideal <= 4800)",
    "negativeTags": "string - <= 1000 chars, keywords em inglês separadas por vírgula",
    "styleWeight": "number 0.00-1.00",
    "weirdnessConstraint": "number 0.00-1.00",
    "audioWeight": "number 0.00-1.00"
  },
  "highlights": {
    "hook": "string - Frase-chave do refrão",
    "mentioned_details": ["array of strings - detalhes específicos usados"]
  }
}

═══════════════════════════════════════════════════════════════════

CAMADA SEMÂNTICA (INTENÇÃO DAS PERGUNTAS):
- Algumas perguntas trazem um bloco "INTENÇÃO DA PERGUNTA".
- Isso NÃO é para copiar texto nem para obedecer como regra rígida de estilo.
- É para você entender o papel musical/poético daquela resposta (ritmo, densidade, estrutura, imagens, respiração).
- Use como interpretação e composição, mantendo naturalidade.

═══════════════════════════════════════════════════════════════════

VALIDAÇÕES FINAIS (FAÇA MENTALMENTE ANTES DE RESPONDER):
✓ JSON está perfeitamente formatado?
✓ Todos os campos obrigatórios estão presentes?
✓ customer_lyrics tem estrutura clara?
✓ suno_payload.lyrics tem tags [Verse], [Chorus], etc?
✓ style é uma frase única em inglês, descritivo?
✓ mentioned_details é um array não-vazio?
✓ Não há frases genéricas sem contexto específico?
✓ A letra tem extensão para 3+ minutos?
✓ Nome do destinatário foi usado 2+ vezes?
✓ Há 3 imagens/cenas concretas (passado, presente, futuro)?

═══════════════════════════════════════════════════════════════════
`.trim();

  // ============================================
  // USER PROMPT - BRIEFING ESPECÍFICO
  // ============================================

  const userPrompt = `
RESPOSTAS DO CLIENTE (${questionsAndAnswers.length} perguntas respondidas):

${questionsText}

═══════════════════════════════════════════════════════════════════

CONTEXTO:
- Idioma da letra: ${languageName}
- Total de perguntas respondidas: ${questionsAndAnswers.length}
- Tema: ${theme}

═══════════════════════════════════════════════════════════════════

SUA TAREFA:
1. Leia TODAS as respostas acima com atenção absoluta.
2. Identifique os detalhes mais específicos e emocionais.
3. Construa uma narrativa que conecte esses detalhes de forma orgânica.
4. Crie uma letra que pareça impossível de ser escrita para outra pessoa.
5. Respeite o tom do tema (celebração, declaração, homenagem, etc).
6. Garanta mínimo 3 minutos de duração quando cantada.
7. Use o nome do destinatário em momentos-chave caso seja coerente com a música.
8. Estruture conforme o gênero escolhido, não engessado.
9. Valide o JSON antes de responder.

═══════════════════════════════════════════════════════════════════

Responda com APENAS JSON válido, bem formatado, seguindo o contrato especificado.
Nada antes, nada depois do JSON.

═══════════════════════════════════════════════════════════════════
`.trim();

  return { systemPrompt, userPrompt };
}



async function callOpenAI(systemPrompt: string, userPrompt: string) {
  const OPENAI_API_KEY = getEnv("OPENAI_API_KEY", true);
  const OPENAI_MODEL = getEnv("OPENAI_MODEL", false) || "gpt-5.2";
  const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";


  const body = {
    model: OPENAI_MODEL,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
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


serve(async (req) => {
  // ✅ Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }


  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);


    const { pedidoId } = (await req.json()) as GenerateLyricsRequest;
    if (!pedidoId) return jsonResponse({ error: "Missing pedidoId" }, 400);


    /**
     * IMPORTANT:
     * In Supabase Edge Functions you do NOT need to create secrets for:
     * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
     * Supabase injects these automatically.
     */
    const SUPABASE_URL = getEnv("SUPABASE_URL", true);
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY", true);


    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });


    // 1) Read order
    const { data: order, error: selErr } = await supabaseAdmin
      .from("musicas_pedidos")
      .select("id, user_id, user_email, user_name, payload, status, created_at, lyrics")
      .eq("id", pedidoId)
      .single();


    if (selErr || !order) {
      return jsonResponse({ error: "Order not found", detail: selErr?.message }, 404);
    }


    // Optional: if already generated, avoid rework
    if (order.lyrics && String(order.lyrics).trim().length > 0) {
      return jsonResponse({ error: "Lyrics already generated for this order", pedidoId }, 409);
    }


    // 2) Build prompts
    const { systemPrompt, userPrompt } = buildPrompts(order);


    // 3) Call OpenAI
    const { data: openaiRaw, outText } = await callOpenAI(systemPrompt, userPrompt);


    // 4) Parse + validate JSON
    const modelJson = parseJsonSafely(outText);
    const errors = validateModelJson(modelJson);


    if (errors.length) {
      await supabaseAdmin
        .from("musicas_pedidos")
        .update({
          status: "generation_failed",
          ai_metadata: {
            error: "MODEL_JSON_INVALID",
            errors,
            raw_output: outText,
          },
        })
        .eq("id", pedidoId);


      return jsonResponse({ error: "Model JSON invalid", errors }, 422);
    }


    // 5) Update order
    const updatePayload = {
      title: modelJson.title,
      lyrics: modelJson.customer_lyrics,
      status: "waiting_user_approval",
      ai_metadata: {
        version: "tc_suno_v1",
        highlights: modelJson.highlights,
        suno_payload: modelJson.suno_payload,
        openai: {
          id: openaiRaw?.id ?? null,
          model: openaiRaw?.model ?? null,
        },
      },
    };


    const { error: updErr } = await supabaseAdmin
      .from("musicas_pedidos")
      .update(updatePayload)
      .eq("id", pedidoId);


    if (updErr) {
      return jsonResponse({ error: "Failed to update order", detail: updErr.message }, 500);
    }


    // 6) Return (ok)
    return jsonResponse({
      ok: true,
      pedidoId,
      title: modelJson.title,
      customer_lyrics: modelJson.customer_lyrics,
      // opcional retornar isso (eu deixei pra debug / você pode remover)
      suno_payload: modelJson.suno_payload,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: (e as Error).message || "Unknown error" }, 500);
  }
});