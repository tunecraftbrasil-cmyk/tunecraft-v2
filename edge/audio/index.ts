import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function text(msg: string, status = 200) {
  return new Response(msg, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

// ============================================
// HELPER: Extrair dados JSON seguramente
// ============================================

function safeJsonParse(data: any, fallback: any = {}) {
  try {
    if (typeof data === "string") return JSON.parse(data);
    return data || fallback;
  } catch (e) {
    console.warn("⚠️ Erro ao fazer parse de JSON:", e);
    return fallback;
  }
}

// ============================================
// HELPER: Extrair idioma do formulário
// ============================================

function extractLanguageFromPayload(payload: any): { code: string; name: string } {
  const parsed = safeJsonParse(payload, {});
  const language = parsed?.answers?.lyricDetails?.language || parsed?.language || "pt_br";

  const languageMap: Record<string, string> = {
    pt_br: "Português Brasileiro",
    pt: "Português Brasileiro",
    en: "English",
    es: "Español",
    it: "Italiano",
  };

  const languageName = languageMap[language] || "Português Brasileiro";
  console.log("🌍 Idioma extraído do formulário:", language, `(${languageName})`);

  return { code: language, name: languageName };
}

// ============================================
// HELPER: Construir style COMPLETO a partir do formulário
// ============================================

function buildCompleteStyleFromFormula(payload: any, baseStyle?: string): string {
  const parsed = safeJsonParse(payload, {});
  const answers = parsed?.answers || {};

  const styleComponents: string[] = [];

  // 1) GÊNERO
  const genre = answers?.musicStyle?.primaryGenre;
  const genreMap: Record<string, string> = {
    mpb: "MPB",
    sertanejo: "sertanejo",
    pop: "pop",
    acoustic: "acoustic",
    rock: "rock",
    gospel: "gospel",
    rap: "rap",
  };

  if (genre && genreMap[genre]) {
    styleComponents.push(genreMap[genre]);
    console.log("🎸 Gênero:", genreMap[genre]);
  } else if (baseStyle) {
    // baseStyle aqui já pode ser uma frase completa em inglês (do gerador de lyrics)
    // se for o caso, é melhor retornar ela direto e só complementar o mínimo.
    styleComponents.push(baseStyle);
    console.log("🎸 Gênero (do baseStyle):", baseStyle);
  }

  // 2) MOOD
  const mood = answers?.musicStyle?.mood;
  const moodMap: Record<string, string> = {
    emotional: "emotional, heartfelt",
    peace: "peaceful, serene",
    goosebumps: "epic, goosebumps, anthemic",
    smile: "uplifting, joyful",
    hope: "hopeful, inspiring",
    strength: "powerful, strong",
  };
  if (mood && moodMap[mood]) {
    styleComponents.push(moodMap[mood]);
    console.log("😊 Mood:", moodMap[mood]);
  }

  // 3) TEMPO
  const tempo = answers?.musicStyle?.tempo;
  const tempoMap: Record<string, string> = {
    calm: "slow, calm",
    balanced: "midtempo, balanced",
    intense: "fast, intense, energetic",
    meditative: "slow, contemplative",
  };
  if (tempo && tempoMap[tempo]) {
    styleComponents.push(tempoMap[tempo]);
    console.log("⏱️ Tempo:", tempoMap[tempo]);
  }

  // 4) VOZ
  const vocalApproach = answers?.productionDetails?.vocalApproach;
  const vocalMap: Record<string, string> = {
    male_soft: "soft male vocals",
    male_strong: "powerful male vocals",
    female_soft: "delicate female vocals",
    female_strong: "powerful female vocals",
    duo: "male-female duet vocals",
    choir: "choir, multiple voices",
  };
  if (vocalApproach && vocalMap[vocalApproach]) {
    styleComponents.push(vocalMap[vocalApproach]);
    console.log("🎤 Voz:", vocalMap[vocalApproach]);
  }

  // 5) INSTRUMENTOS
  let instrumentos = "";
  if (genre === "mpb") instrumentos = "acoustic guitar, strings, subtle percussion";
  else if (genre === "sertanejo") instrumentos = "acoustic guitar, drums, traditional percussion";
  else if (genre === "pop") instrumentos = "synth, drums, bass, melodic elements";
  else if (genre === "acoustic") instrumentos = "acoustic guitar, fingerpicked, subtle strings";
  else if (genre === "rock") instrumentos = "electric guitar, drums, bass, rock rhythm";
  else if (genre === "gospel") instrumentos = "piano, strings, organ, gospel arrangement";
  else if (genre === "rap") instrumentos = "beat, drums, bass, rhythmic elements";

  if (instrumentos) {
    styleComponents.push(instrumentos);
    console.log("🎸 Instrumentação:", instrumentos);
  }

  // 6) IDIOMA (qualificador)
  const language = parsed?.answers?.lyricDetails?.language || parsed?.language || "pt_br";
  const languageQualifiers: Record<string, string> = {
    pt_br: "brazilian portuguese, PT-BR, native speaker",
    pt: "portuguese, native speaker",
    en: "english, ENG, native speaker",
    es: "spanish, native speaker",
    it: "italian, native speaker",
  };
  if (languageQualifiers[language]) {
    styleComponents.push(languageQualifiers[language]);
    console.log("🌍 Idioma qualificador:", languageQualifiers[language]);
  }

  // 7) QUALIDADE
  styleComponents.push("professional, high quality, natural tone, clear vocals");
  console.log("✨ Qualidade:", "professional, high quality, natural tone, clear vocals");

  // 8) EVITAR
  styleComponents.push("authentic, genuine, not robotic, not auto-tuned");
  console.log("❌ Evitar:", "robotic, auto-tuned, low quality");

  // Combine e respeite limite (opcional)
  let finalStyle = styleComponents.join(", ");
  const MAX_LENGTH = 1000; // a API aceita 1000, então não precisa cortar em 250
  console.log("📊 Style bruto:", finalStyle.length, "chars");

  if (finalStyle.length > MAX_LENGTH) {
    finalStyle = finalStyle.substring(0, MAX_LENGTH - 3) + "...";
  }

  console.log("✅ Style final:", finalStyle);
  console.log("📏 Tamanho final:", finalStyle.length, "caracteres");

  return finalStyle;
}

// ============================================
// ✅ Patch: helpers para priorizar style do GPT
// ============================================

function normalizeStyle(s: any): string {
  if (typeof s !== "string") return "";
  // normaliza whitespace e remove quebras múltiplas
  return s.replace(/\s+/g, " ").trim();
}

// validação LEVE (não “engessa”)
// Você pode deixar só o length + not empty, se quiser 0 fricção.
function isLikelyValidSunoStyle(style: string): boolean {
  const s = normalizeStyle(style);
  if (!s) return false;
  if (s.length < 10) return false;
  if (s.length > 1000) return false; // limite do V5 na sua lógica
  return true;
}

// ============================================
// HELPER: Selecionar melhor versão (RETORNANDO suno_payload completo)
// ============================================

type SelectedVersion = {
  prompt: string;
  style: string;
  title: string;
  negativeTags: string;
  styleWeight: number;
  weirdnessConstraint: number;
  audioWeight: number;
  versionUsed: string;
  sourceInfo: string;
};

function normalizeSunoFromContainer(container: any, fallback: Partial<SelectedVersion> = {}): Partial<SelectedVersion> {
  const sp = container?.suno_payload || container?.sunoPayload || {};
  return {
    prompt: sp.prompt || container?.prompt || container?.lyrics || container?.customer_lyrics || fallback.prompt,
    style: sp.style || container?.style || fallback.style,
    title: sp.title || container?.title || fallback.title,
    negativeTags: sp.negativeTags || container?.negativeTags || fallback.negativeTags,
    styleWeight: typeof sp.styleWeight === "number" ? sp.styleWeight : fallback.styleWeight,
    weirdnessConstraint:
      typeof sp.weirdnessConstraint === "number" ? sp.weirdnessConstraint : fallback.weirdnessConstraint,
    audioWeight: typeof sp.audioWeight === "number" ? sp.audioWeight : fallback.audioWeight,
  };
}

function selectBestVersion(pedido: any): SelectedVersion {
  const versaoEscolhida = (pedido.versao_escolhida || "").toLowerCase();
  const temOriginal = !!pedido.versao_original;
  const temModificada = !!pedido.versao_modificada;

  const aiMeta = safeJsonParse(pedido.ai_metadata, {});
  const aiSuno = aiMeta?.suno_payload || {};

  // Defaults
  const defaults: SelectedVersion = {
    prompt: (aiSuno.prompt || pedido.lyrics || "").toString(),
    style: (aiSuno.style || "acoustic, heartfelt, soft vocals").toString(),
    title: (aiSuno.title || pedido.title || "Untitled").toString(),
    negativeTags: (aiSuno.negativeTags || "robotic, low quality, distorted, auto-tuned, mumbling, unclear vocals")
      .toString(),
    styleWeight: typeof aiSuno.styleWeight === "number" ? aiSuno.styleWeight : 0.82,
    weirdnessConstraint: typeof aiSuno.weirdnessConstraint === "number" ? aiSuno.weirdnessConstraint : 0.18,
    audioWeight: typeof aiSuno.audioWeight === "number" ? aiSuno.audioWeight : 0.0,
    versionUsed: "fallback",
    sourceInfo: "fallback_ai_metadata",
  };

  // Helper para montar retorno final
  function finalize(partial: Partial<SelectedVersion>, versionUsed: string, sourceInfo: string): SelectedVersion {
    return {
      prompt: (partial.prompt || defaults.prompt || "").toString(),
      style: (partial.style || defaults.style || "").toString(),
      title: (partial.title || defaults.title || "Untitled").toString(),
      negativeTags: (partial.negativeTags || defaults.negativeTags || "").toString(),
      styleWeight: typeof partial.styleWeight === "number" ? partial.styleWeight : defaults.styleWeight,
      weirdnessConstraint:
        typeof partial.weirdnessConstraint === "number" ? partial.weirdnessConstraint : defaults.weirdnessConstraint,
      audioWeight: typeof partial.audioWeight === "number" ? partial.audioWeight : defaults.audioWeight,
      versionUsed,
      sourceInfo,
    };
  }

  // Escolha explícita
  if (versaoEscolhida === "modificada" && temModificada) {
    console.log("✅ Usando VERSÃO MODIFICADA (escolhida pelo usuário)");
    const vm = pedido.versao_modificada;
    const merged = normalizeSunoFromContainer(vm, defaults);
    return finalize(merged, "modificada", "user_selected_modified");
  }

  if (versaoEscolhida === "original" && temOriginal) {
    console.log("✅ Usando VERSÃO ORIGINAL (escolhida pelo usuário)");
    const vo = pedido.versao_original;
    const merged = normalizeSunoFromContainer(vo, defaults);
    return finalize(merged, "original", "user_selected_original");
  }

  // Auto-seleção
  if (temModificada && !versaoEscolhida) {
    console.log("✅ Usando VERSÃO MODIFICADA (existe, sem escolha explícita)");
    const vm = pedido.versao_modificada;
    const merged = normalizeSunoFromContainer(vm, defaults);
    return finalize(merged, "modificada", "auto_selected_modified");
  }

  if (temOriginal && !versaoEscolhida) {
    console.log("✅ Usando VERSÃO ORIGINAL (padrão)");
    const vo = pedido.versao_original;
    const merged = normalizeSunoFromContainer(vo, defaults);
    return finalize(merged, "original", "auto_selected_original");
  }

  console.log("✅ Usando FALLBACK (ai_metadata)");
  return defaults;
}

// ============================================
// HELPER: Extrair vocalGender do payload ("m" | "f" | "")
// ============================================

function extractVocalGender(payload: any): string {
  try {
    const parsed = safeJsonParse(payload, {});
    const vocalApproach = parsed?.answers?.productionDetails?.vocalApproach || parsed?.step15 || "";

    const v = String(vocalApproach).toLowerCase();

    // Se for algo como "male_soft", "male_strong"
    if (v.includes("male")) return "m";
    if (v.includes("female")) return "f";

    // Dueto/coral = não forçar gênero
    if (v.includes("duo") || v.includes("dueto")) return "";
    if (v.includes("choir") || v.includes("coral")) return "";

    return "";
  } catch (e) {
    console.warn("⚠️ Erro ao extrair vocalGender:", e);
    return "";
  }
}

// ============================================
// VALIDAÇÃO: Garantir que prompt/lyrics é válido
// ============================================

function validateLyricsPrompt(prompt: string): boolean {
  if (!prompt || typeof prompt !== "string") return false;
  const t = prompt.trim();
  if (t.length < 50) return false;
  if (t.length > 5000) return false; // V5 prompt limit

  // aceita tags ou separação por blocos
  const hasStructure = /\[verse\b|\[chorus\b|\[bridge\b|\[outro\b|\n\n/i.test(t);
  return hasStructure;
}

// ============================================
// MAIN SERVE
// ============================================

serve(async (req) => {
  console.log("🚀 Edge function generate-audio iniciada");

  // Preflight
  if (req.method === "OPTIONS") {
    console.log("✅ Respondendo preflight");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") return text("Method not allowed", 405);

    console.log("📖 Lendo body...");
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      console.error("❌ Body inválido:", e);
      return text("Bad Request: invalid JSON body", 400);
    }

    const pedido_id = body?.pedido_id;
    console.log("📝 Pedido ID recebido:", pedido_id);

    if (!pedido_id) {
      console.error("❌ Pedido ID faltando");
      return text("Bad Request: missing pedido_id", 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    console.log("🔍 Buscando pedido:", pedido_id);
    const { data: pedido, error: pedidoErr } = await supabase
      .from("musicas_pedidos")
      .select("*")
      .eq("id", pedido_id)
      .single();

    if (pedidoErr || !pedido) {
      console.error("❌ Pedido não encontrado:", pedidoErr);
      return text("Pedido não encontrado", 404);
    }

    console.log("✅ Pedido encontrado:", pedido.id);

    const currentStatus = (pedido.status || "").toLowerCase();
    console.log("📊 Status atual:", currentStatus);

    if (["generating_audio", "processing", "completed", "produced"].includes(currentStatus)) {
      console.log("⏸️  Geração já em progresso ou completa");
      return json(
        {
          success: true,
          message: "Geração já está em andamento ou completa.",
          status: currentStatus,
        },
        200,
      );
    }

    console.log("✏️  Atualizando status para generating_audio...");
    const { error: updErr } = await supabase
      .from("musicas_pedidos")
      .update({
        status: "generating_audio",
        generation_started_at: new Date().toISOString(),
      })
      .eq("id", pedido_id);

    if (updErr) {
      console.error("❌ Erro ao atualizar status:", updErr);
      return text("Erro ao atualizar status: " + updErr.message, 500);
    }

    console.log("✅ Status atualizado");

    const sunoApiKey = Deno.env.get("SUNOAPI_KEY");
    if (!sunoApiKey) {
      console.error("❌ SUNOAPI_KEY não configurada");
      return text("Missing SUNOAPI_KEY", 500);
    }

    // Idioma (apenas para logging / WhatsApp)
    const { code: languageCode, name: languageName } = extractLanguageFromPayload(pedido.payload);

    // Selecionar melhor versão (AGORA retorna prompt + negativos + pesos)
    const selected = selectBestVersion(pedido);

    if (!validateLyricsPrompt(selected.prompt)) {
      console.error("❌ Prompt/Lyrics inválido");
      await supabase
        .from("musicas_pedidos")
        .update({ status: "error", error_reason: "invalid_lyrics_prompt" })
        .eq("id", pedido_id);

      return text("Erro: letras/prompt inválido ou muito curto/longo", 400);
    }

    console.log("🎵 Versão usada:", selected.versionUsed);
    console.log("📍 Fonte:", selected.sourceInfo);
    console.log("📝 Título:", selected.title);
    console.log("📜 Prompt (primeiros 150 chars):", selected.prompt.substring(0, 150) + "...");
    console.log("🏷️ negativeTags:", selected.negativeTags);
    console.log("⚖️ styleWeight/weirdness/audio:", selected.styleWeight, selected.weirdnessConstraint, selected.audioWeight);

    // ======================================================
    // STYLE: prioriza o que veio do GPT (selected.style)
    // fallback: buildCompleteStyleFromFormula(form)
    // ======================================================

    const gptStyle = normalizeStyle(selected.style);

    // se o GPT mandou um style ok, usa ele diretamente (sem "sistema paralelo")
    let finalStyle = "";
    let styleSource = "";

    if (isLikelyValidSunoStyle(gptStyle)) {
      finalStyle = gptStyle;
      styleSource = "gpt_style";
    } else {
      finalStyle = buildCompleteStyleFromFormula(pedido.payload);
      styleSource = "form_style_fallback";
    }

    console.log("🎛️ Style source:", styleSource);
    console.log("✅ Style final:", finalStyle);

    console.log("🌍 Idioma respeita formulário:", languageCode, `(${languageName})`);
    console.log("✅ Style final:", finalStyle);

    // Montar payload para Suno (CHAVES CORRETAS)
    const sunoPayload: any = {
      customMode: true,
      instrumental: false,
      model: "V5",
      prompt: selected.prompt, // ✅ usa prompt com tags
      style: finalStyle,
      title: selected.title,
      negativeTags: selected.negativeTags, // ✅ era negativeStyle
      styleWeight: selected.styleWeight,
      weirdnessConstraint: selected.weirdnessConstraint,
      audioWeight: selected.audioWeight,
      callBackUrl: `${supabaseUrl}/functions/v1/sunoapi-webhook`,
    };

    const vocalGender = extractVocalGender(pedido.payload);
    if (vocalGender) {
      sunoPayload.vocalGender = vocalGender; // ✅ era voiceGender
    }

    console.log("📤 Payload Suno:", JSON.stringify(sunoPayload, null, 2));
    console.log("🎵 Chamando sunoapi.org...");

    // Chamar Suno API
    const res = await fetch("https://api.sunoapi.org/api/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sunoApiKey}`,
      },
      body: JSON.stringify(sunoPayload),
    });

    console.log("📤 Suno API status:", res.status);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("❌ Suno API error:", res.status, errText);

      await supabase
        .from("musicas_pedidos")
        .update({
          status: "error",
          error_reason: `suno_api_error_${res.status}`,
        })
        .eq("id", pedido_id);

      return text("Suno API error: " + res.status + " - " + errText, 502);
    }

    const result = await res.json().catch(() => ({} as any));
    console.log("✅ Suno API respondeu:", JSON.stringify(result));

    if (!result?.data?.taskId) {
      console.error("❌ taskId não retornou:", result);

      await supabase
        .from("musicas_pedidos")
        .update({
          status: "error",
          error_reason: "no_task_id",
        })
        .eq("id", pedido_id);

      return text("Erro: sem taskId da Suno", 502);
    }

    const taskId = result.data.taskId;
    console.log("✅ Task criada:", taskId);

    // Salvar task ID
    console.log("💾 Salvando task ID no banco...");
    const { error: taskErr } = await supabase
      .from("musicas_pedidos")
      .update({
        apiframe_task_id: taskId,
        status: "generating_audio",
      })
      .eq("id", pedido_id);

    if (taskErr) {
      console.error("❌ Erro ao salvar task_id:", taskErr);
      return text("Erro ao salvar task_id: " + taskErr.message, 500);
    }

    console.log("✅ Task ID salvo com sucesso!");

    // WhatsApp (não bloqueante)
    console.log("📱 Enviando notificação WhatsApp...");
    try {
      const whatsappResp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          pedidoId: pedido_id,
          type: "production_started",
          versionUsed: selected.versionUsed,
          language: languageName,
        }),
      });

      const whatsappData = await whatsappResp.json().catch(() => ({}));
      if (whatsappData.success) console.log("✅ WhatsApp enviado:", whatsappData.messageSid);
      else console.warn("⚠️ WhatsApp não foi enviado:", whatsappData.error);
    } catch (whatsappError) {
      console.error("⚠️ Erro ao enviar WhatsApp (não bloqueante):", whatsappError);
    }

    // Resposta final
    console.log("✅ Generate-audio finalizado com sucesso!");
    return json(
      {
        success: true,
        task_id: taskId,
        version_used: selected.versionUsed,
        source: selected.sourceInfo,
        language: languageName,
        style_final: finalStyle,
        style_source: styleSource,
        title: selected.title,
        suno_used: {
          has_vocalGender: !!sunoPayload.vocalGender,
          styleWeight: selected.styleWeight,
          weirdnessConstraint: selected.weirdnessConstraint,
          audioWeight: selected.audioWeight,
          negativeTags: selected.negativeTags,
        },
      },
      200,
    );
  } catch (err) {
    console.error("❌ Erro interno:", err);
    return text("Erro interno: " + (err as any).message, 500);
  }
});
