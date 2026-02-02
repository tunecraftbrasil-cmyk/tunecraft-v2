// ============================================
// CHAT.JS v2 - MAIN (Lógica Principal)
// ============================================

// ============================================
// VARIÁVEL GLOBAL: SERÁ DEFINIDA EM chat_themes_full.js
// ============================================
let elaboratedChatFlow = [];

// ============================================
// HELPERS: MANIPULAR OBJETOS ANINHADOS
// ============================================

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) current[key] = {};
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let currentStep = 0;
let formData = {};
let currentQuestion = null;
let draftBeingEdited = null;

// ============================================
// FUNÇÕES DE INTERFACE
// ============================================

function scrollToBottom() {
    const messagesContainer = document.getElementById("chatMessages");
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
}

function openChat() {
    document.getElementById("chatModal").classList.add("active");
    initChat();
}

function closeChat() {
    document.getElementById("chatModal").classList.remove("active");
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeChat();
});

function initChat() {
    currentStep = 0;
    
    // DEBUG: Verificar se elaboratedChatFlow existe
    if (!elaboratedChatFlow || elaboratedChatFlow.length === 0) {
        console.error("❌ ERRO: elaboratedChatFlow não foi carregado! Verifique se chat_themes_full.js foi importado.");
        alert("Erro ao carregar o chat. Verifique o console.");
        return;
    }
    
    if (window.draftBeingEdited?.payload) {
        formData = { ...window.draftBeingEdited.payload };
        console.log("📝✅ Editando draft:", formData);
    } else {
        formData = {
            form_id: "tc_chat_v2",
            form_version: 2,
            asked: [],
            answers: {}
        };
        console.log("📝✅ Novo chat");
    }
    
    document.getElementById("chatMessages").innerHTML = "";
    console.log("🎯 Total de steps disponíveis:", elaboratedChatFlow.length);
    renderQuestion();
}

// ============================================
// RENDERIZAÇÃO DAS PERGUNTAS
// ============================================

function renderQuestion() {
    const inputContainer = document.getElementById("inputSection");
    inputContainer.innerHTML = "";

    // 🔍 DEBUG: Ver estado atual
    console.log("🔍 DEBUG renderQuestion:");
    console.log("   formData.step_0 =", formData.step_0);
    console.log("   formData.step_100 =", formData.step_100);
    console.log("   formData =", formData);

    // Filtrar apenas steps válidos para este tema
    const validSteps = elaboratedChatFlow.filter((step) => {
        if (step.condition) return step.condition(formData);
        return true;
    });

    console.log("📋 Steps válidos para este tema:", validSteps.length);
    console.log("📍 Current step (index):", currentStep);

    // Se passou do limite
    if (currentStep >= validSteps.length) {
        console.log("✅ Fim do formulário! Mostrando botão Salvar");
        renderSaveButton(inputContainer);
        scrollToBottom();
        return;
    }

    currentQuestion = validSteps[currentStep];

    if (!currentQuestion) {
        console.error("❌ Erro: currentQuestion é null");
        console.log("   validSteps.length =", validSteps.length);
        console.log("   currentStep =", currentStep);
        return;
    }

    console.log("📌 Pergunta atual:", currentQuestion.step, "-", currentQuestion.question);

    const progress = ((currentStep + 1) / (validSteps.length + 1)) * 100;
    const pf = document.getElementById("progressFill");
    if (pf) pf.style.width = progress + "%";

    addMessage("bot", currentQuestion.question);

    setTimeout(() => {
        renderInput(currentQuestion, inputContainer);
        scrollToBottom();
    }, 500);
}
function addMessage(sender, text) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) {
        console.error("❌ Elemento #chatMessages não encontrado!");
        return;
    }

    const messageEl = document.createElement("div");
    messageEl.className = "message";

    if (sender === "bot") {
        messageEl.innerHTML = `<div class="bot-message"><div class="avatar">🎵</div><div class="bubble">${text}</div></div>`;
    } else {
        messageEl.innerHTML = `<div class="user-message">${text}</div>`;
    }

    messagesContainer.appendChild(messageEl);
    scrollToBottom();
}

function renderInput(question, container) {
    if (!question) {
        console.error("❌ Pergunta não definida!");
        return;
    }

    let html = `<div class="input-label">SUA RESPOSTA</div>`;

    if (question.type === "select") {
        html += `<div class="options-grid">`;
        question.options.forEach(opt => {
            html += `<button class="option-btn" onclick="handleOption('${opt.value}', '${opt.label}')">${opt.label}</button>`;
        });
        html += `</div>`;
    } else if (question.type === "input") {
        html += `<input type="text" class="chat-text-input" id="chatInput" placeholder="${question.placeholder || ''}" onkeypress="if(event.key==='Enter') handleInput()">
                 <button class="btn-chat-action" onclick="handleInput()">Enviar</button>`;
    } else if (question.type === "textarea") {
        html += `<textarea class="chat-text-input" id="chatInput" rows="3" placeholder="${question.placeholder || ''}"></textarea>
                 <button class="btn-chat-action" onclick="handleInput()">Enviar</button>`;
    }

    html += `<div class="action-buttons" style="margin-top: 1rem;">
                ${currentStep > 0 ? '<button class="btn-back" onclick="prevStep()">← Voltar</button>' : ""}
             </div>`;

    container.innerHTML = html;

    const input = document.getElementById("chatInput");
    if (input) input.focus();
}

// ============================================
// HANDLERS DE INPUT
// ============================================

function handleOption(val, label) {
    addMessage("user", label);
    
    // ✅ PASSO 1: Salvar a resposta IMEDIATAMENTE
    setNestedValue(formData.answers, currentQuestion.metadata.fieldName, val);
    formData[`step_${currentQuestion.step}`] = val;  // ← SUPER IMPORTANTE!
    
    // ✅ PASSO 2: Registrar no array asked
    formData.asked = formData.asked || [];
    formData.asked.push({
        id: currentQuestion.metadata.fieldName,
        fieldName: currentQuestion.metadata.fieldName,
        section: currentQuestion.section,
        question: currentQuestion.question.replace(/[^\w\s\.,!?¿¡áéíóúãõàâêôçÁÉÍÓÚÃÕÀÂÊÔÇ]/g, '').trim(),
        answerLabel: label.replace(/[^\w\s\.,!?¿¡áéíóúãõàâêôçÁÉÍÓÚÃÕÀÂÊÔÇ]/g, '').trim(),
        answerValue: val,
        timestamp: new Date().toISOString()
    });
    
    console.log("✅ Resposta salva:", currentQuestion.step, "=", val);
    console.log("📊 formData agora:", formData);
    
    // ✅ PASSO 3: DEPOIS incrementar
    currentStep++;
    
    // ✅ PASSO 4: DEPOIS renderizar (com dados ATUALIZADOS)
    setTimeout(renderQuestion, 600);
}

function handleInput() {
    const val = document.getElementById("chatInput").value;
    if (!val.trim()) return;

    if (currentQuestion.minLength && val.length < currentQuestion.minLength) {
        alert(`Por favor, escreva pelo menos ${currentQuestion.minLength} caracteres.`);
        return;
    }

    addMessage("user", val);
    
    // ✅ PASSO 1: Salvar IMEDIATAMENTE
    setNestedValue(formData.answers, currentQuestion.metadata.fieldName, val);
    formData[`step_${currentQuestion.step}`] = val;  // ← SUPER IMPORTANTE!
    
    // ✅ PASSO 2: Registrar
    formData.asked = formData.asked || [];
    formData.asked.push({
        id: currentQuestion.metadata.fieldName,
        fieldName: currentQuestion.metadata.fieldName,
        section: currentQuestion.section,
        question: currentQuestion.question.replace(/[^\w\s\.,!?¿¡áéíóúãõàâêôçÁÉÍÓÚÃÕÀÂÊÔÇ]/g, '').trim(),
        answerLabel: val,
        answerValue: val,
        timestamp: new Date().toISOString()
    });
    
    console.log("✅ Resposta salva:", currentQuestion.step, "=", val);
    console.log("📊 formData agora:", formData);
    
    // ✅ PASSO 3: DEPOIS incrementar
    currentStep++;
    
    // ✅ PASSO 4: DEPOIS renderizar
    setTimeout(renderQuestion, 600);
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        renderQuestion();
    }
}

// ============================================
// SALVAR DRAFT
// ============================================

function renderSaveButton(container) {
    const pf = document.getElementById("progressFill");
    if (pf) pf.style.width = "100%";

    addMessage("bot", "Perfeito! Tenho todas as informações. Vou salvar seu formulário para você revisar e pagar quando quiser. 💾");
    
    container.innerHTML = `
        <div class="input-label">FINALIZAR FORMULÁRIO</div>
        <button class="btn-chat-action" onclick="saveDraftOnly()">✅ Salvar Formulário</button>
    `;
    
    scrollToBottom();
}

async function saveDraftOnly() {
    try {
        console.log("🔍 DEBUG: Começando salvamento...");
        console.log("📊 formData completo:", formData);
        console.log("📋 Array asked:", formData.asked);
        console.log("💾 Objeto answers:", formData.answers);

        showToast("💾 Salvando formulário...", "info");

        const session = await getSessionOrRedirect();
        if (!session) {
            alert("Você precisa estar logado. Redirecionando...");
            window.location.href = "login.html";
            return;
        }

        function sbHeaders({ prefer = true } = {}) {
            const h = {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
            };
            if (prefer) h.Prefer = "return=representation";
            return h;
        }

        // ⚠️ IMPORTANTE: Verificar que formData tem tudo
        const payloadToSave = {
            form_id: formData.form_id || "tc_chat_v2",
            form_version: formData.form_version || 2,
            asked: formData.asked || [],
            answers: formData.answers || {},
            // Adicionar informações de meta
            total_questions_answered: (formData.asked || []).length,
            created_at: new Date().toISOString()
        };

        console.log("✅ Payload pronto para salvar:", payloadToSave);

        let pedidoId = draftBeingEdited?.pedidoId;

        if (draftBeingEdited && pedidoId) {
            console.log("✏️ Atualizando draft existente:", pedidoId);

            const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/musicas_pedidos?id=eq.${pedidoId}`, {
                method: 'PATCH',
                headers: sbHeaders({ prefer: true }),
                body: JSON.stringify({
                    payload: payloadToSave,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                const errText = await updateResponse.text();
                console.error("[TuneCraft] Erro ao atualizar draft:", updateResponse.status, errText);
                throw new Error(`Erro ao atualizar (${updateResponse.status}): ${errText}`);
            }

            const updatedData = await updateResponse.json();
            console.log('✅ Draft atualizado com sucesso:', updatedData);
            showToast("✅ Formulário atualizado!", "success");

        } else {
            console.log("📝 Criando novo draft...");
            console.log("📤 POST Body:", JSON.stringify({
                user_id: session.user.id,
                user_email: session.user.email,
                user_name: session.user.user_metadata?.full_name || "Usuário",
                payload: payloadToSave,
                status: 'draft'
            }, null, 2));

            const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/musicas_pedidos`, {
                method: 'POST',
                headers: sbHeaders({ prefer: true }),
                body: JSON.stringify({
                    user_id: session.user.id,
                    user_email: session.user.email,
                    user_name: session.user.user_metadata?.full_name || "Usuário",
                    payload: payloadToSave,
                    status: 'draft'
                })
            });

            if (!insertResponse.ok) {
                const errText = await insertResponse.text();
                console.error("[TuneCraft] Erro ao salvar draft:", insertResponse.status, errText);
                throw new Error(`Erro ao salvar (${insertResponse.status}): ${errText}`);
            }

            const data = await insertResponse.json();
            console.log('📥 Resposta do servidor:', data);
            
            pedidoId = data?.[0]?.id;

            if (!pedidoId) {
                console.warn("⚠️ Aviso: ID não retornado. Procurando em data...", data);
                throw new Error('Draft criado, mas ID não foi retornado');
            }

            console.log('✅ Draft criado com ID:', pedidoId);
            showToast("✅ Formulário salvo!", "success");
        }

        localStorage.setItem('tuneCraft_lastDraftId', pedidoId);
        console.log("💾 ID salvo em localStorage:", pedidoId);
        
        closeChat();
        window.draftBeingEdited = null;
        draftBeingEdited = null;

        setTimeout(() => {
            console.log("🔄 Redirecionando para dashboard...");
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('❌ ERRO FATAL ao salvar draft:', error);
        console.error('Stack trace:', error.stack);
        showToast(`❌ Erro: ${error.message}`, "error");
    }
}


// ============================================
// HELPER: VALIDAR SESSÃO
// ============================================

async function getSessionOrRedirect() {
    if (!window.supabase) {
        console.error("Supabase JS não está carregado");
        return null;
    }

    window.sb = window.sb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await window.sb.auth.getSession();
    
    if (error) {
        console.warn("[TuneCraft] getSession error:", error);
        return null;
    }

    const session = data?.session;

    if (!session?.access_token || !session?.user?.id) {
        console.warn("[TuneCraft] Sem sessão válida");
        return null;
    }

    return session;
}

// ============================================
// HELPER: TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// ESTILOS DE ANIMAÇÃO
// ============================================

if (!document.getElementById('chat-animations')) {
    const style = document.createElement('style');
    style.id = 'chat-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// LOG: Verificar quando elaboratedChatFlow é carregado
// ============================================
console.log("✅ chat.js carregado. Aguardando chat_themes_full.js...");
