// ============================================
// ARQUIVO NOVO: form_options.js
// Centraliza TODAS as opções de formulário
// Use em chat.js e dashboard.js
// ============================================

/**
 * VANTAGEM:
 * - Um único lugar para manter as opções
 * - Chat.js usa para renderizar selects
 * - Dashboard.js usa para edição
 * - Muda aqui, atualiza TUDO automaticamente
 */

const FORM_OPTIONS = {
    themes: [
        { label: "🎂 Aniversário", value: "birthday" },
        { label: "💌 Declaração de amor", value: "love_declaration" },
        { label: "💍 Pedido de casamento", value: "proposal" },
        { label: "👶 Nascimento de filho(a)", value: "birth_child" },
        { label: "👵👶 Nascimento de neto(a)", value: "birth_grandchild" },
        { label: "🌹 Homenagem", value: "tribute" },
        { label: "🤝 Amizade", value: "friendship" },
        { label: "🏢 Música corporativa", value: "corporate" },
        { label: "✨ Oração", value: "prayer" },
        { label: "📢 Anúncio de gravidez", value: "pregnancy_announcement" },
        { label: "🎭 Outro", value: "other" }
    ],
    
    moods: [
        { label: "😭 Emocionar", value: "emotional" },
        { label: "☮️ Paz", value: "peace" },
        { label: "✨ Arrepio", value: "goosebumps" },
        { label: "😊 Sorriso", value: "smile" },
        { label: "🌅 Esperança", value: "hope" },
        { label: "💪 Força", value: "strength" }
    ],
    
    tempos: [
        { label: "🌊 Calma", value: "calm" },
        { label: "⚖️ Equilibrada", value: "balanced" },
        { label: "📈 Intensa", value: "intense" },
        { label: "🧘 Meditativa", value: "meditative" }
    ],
    
    genres: [
        { label: "🎸 MPB", value: "mpb" },
        { label: "🤠 Sertanejo", value: "sertanejo" },
        { label: "🎤 Pop", value: "pop" },
        { label: "🎺 Acústico", value: "acoustic" },
        { label: "🎸 Rock", value: "rock" },
        { label: "✨ Gospel", value: "gospel" },
        { label: "🎙️ Rap", value: "rap" }
    ],
    
    audiences: [
        { label: "Meus pais", value: "parents" },
        { label: "Meu(minha) companheiro(a)", value: "partner" },
        { label: "Meu(minha) melhor amigo(a)", value: "best_friend" },
        { label: "Outro", value: "other" }
    ],
    
    narratorRoles: [
        { label: "Casal", value: "couple" },
        { label: "Pais", value: "parents" },
        { label: "Amigo", value: "friend" },
        { label: "Outro", value: "other" }
    ],
    
    pregnancyStages: [
        { label: "Ainda ninguém sabe", value: "secret" },
        { label: "Apenas família sabe", value: "family" },
        { label: "Já é público", value: "public" }
    ],
    
    languages: [
        { label: "🇧🇷 Português (BR)", value: "pt_br" },
        { label: "🇺🇸 Inglês", value: "en" },
        { label: "🇪🇸 Espanhol", value: "es" },
        { label: "🇮🇹 Italiano", value: "it" }
    ],
    
    vocalApproaches: [
        { label: "🎙️ Masc. suave", value: "male_soft" },
        { label: "🎙️ Masc. intensa", value: "male_strong" },
        { label: "🎤 Fem. delicada", value: "female_soft" },
        { label: "🎤 Fem. poderosa", value: "female_strong" },
        { label: "🎵 Dueto", value: "duo" },
        { label: "👥 Coral", value: "choir" }
    ],
    
    povs: [
        { label: "💬 Para essa pessoa", value: "second_person" },
        { label: "🌍 Sobre", value: "third_person" },
        { label: "🔄 Misto", value: "mixed" }
    ],
    
    ageGroups: [
        { label: "Criança (até 12 anos)", value: "child12" },
        { label: "Teen (13-19 anos)", value: "teen" },
        { label: "Jovem adulto (20-35)", value: "adultyoung" },
        { label: "Adulto (36-55)", value: "adultmiddle" },
        { label: "Senior (56+ anos)", value: "adultsenior" }
    ]
};
