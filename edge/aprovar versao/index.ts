import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { pedidoId, versaoEscolhida } = await req.json();

    console.log("📝 Recebido:", { pedidoId, versaoEscolhida });

    if (!pedidoId) {
      return jsonResponse({ error: "Missing pedidoId" }, 400);
    }

    if (!versaoEscolhida || !["original", "modificada"].includes(versaoEscolhida)) {
      return jsonResponse({ 
        error: "versaoEscolhida deve ser 'original' ou 'modificada'" 
      }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Variáveis de ambiente faltando");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1️⃣ Buscar pedido
    console.log("🔍 Buscando pedido:", pedidoId);
    
    const { data: pedido, error: fetchErr } = await supabase
      .from("musicas_pedidos")
      .select("id, status, versao_original, versao_modificada")
      .eq("id", pedidoId)
      .single();

    if (fetchErr || !pedido) {
      console.error("❌ Pedido não encontrado:", fetchErr);
      return jsonResponse({ 
        error: "Pedido não encontrado", 
        detail: fetchErr?.message 
      }, 404);
    }

    console.log("✅ Pedido encontrado:", pedido.id);
    console.log("📊 Status atual:", pedido.status);

    // 2️⃣ Validar que a versão escolhida existe
    if (versaoEscolhida === "modificada" && !pedido.versao_modificada) {
      console.error("❌ versao_modificada não existe");
      return jsonResponse({ 
        error: "Versão modificada não existe neste pedido" 
      }, 400);
    }

    if (versaoEscolhida === "original" && !pedido.versao_original) {
      console.error("❌ versao_original não existe");
      return jsonResponse({ 
        error: "Versão original não existe neste pedido" 
      }, 400);
    }

    // 3️⃣ Atualizar banco com a escolha
    console.log(`💾 Salvando escolha: ${versaoEscolhida}`);
    
    const { error: updateErr } = await supabase
      .from("musicas_pedidos")
      .update({
  versao_aprovada_tipo: versaoEscolhida, // ✅ usa a coluna existente
  status: "production",
})
      .eq("id", pedidoId);

    if (updateErr) {
      console.error("❌ Erro ao salvar:", updateErr);
      return jsonResponse({ 
        error: "Erro ao salvar escolha", 
        detail: updateErr.message 
      }, 500);
    }

    console.log("✅ Escolha salva com sucesso!");

    return jsonResponse({
      success: true,
      pedidoId,
      versaoEscolhida,
      mensagem: `Versão ${versaoEscolhida} aprovada! A produção iniciará em breve.`,
    });

  } catch (e) {
    console.error("❌ Erro:", e);
    return jsonResponse({ 
      error: (e as Error).message || "Unknown error" 
    }, 500);
  }
});
