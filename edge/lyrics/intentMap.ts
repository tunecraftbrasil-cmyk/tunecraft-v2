// intentMap.ts
// Mapa de "intenção musical/poética" por fieldName.
// Usado para orientar o modelo a interpretar a resposta (e não copiar literalmente).

export const questionIntentMap: Record<string, string> = {
  // =========================
  // UNIVERSAL / META
  // =========================
  "ai_metadata.themeId":
    "Define o eixo narrativo e o tom geral (aniversário, amor, oração, etc). Deve guiar vocabulário, imagens e energia emocional.",

  "ai_metadata.subThemeId":
    "Subtema que muda o formato da composição (ex.: 'música para a vida' vs 'canção de ninar'). Impacta andamento, densidade e repetição.",

  "ai_metadata.relationship":
    "Define vínculo/relacionamento. Deve influenciar intimidade, apelidos, nível de humor, e proximidade emocional das frases.",

  "ai_metadata.pov":
    "Define POV (2ª pessoa: 'você', 3ª pessoa: 'ela/ele', misto). Deve manter consistência e coerência na narrativa e nos pronomes.",

  "lyricDetails.language":
    "Define idioma de escrita. Deve manter vocabulário natural e cantável, sem misturar línguas (a não ser que o briefing peça).",

  "lyricDetails.languageOther":
    "Idioma alternativo solicitado. Deve substituir o idioma padrão e ajustar expressões culturais/idiomáticas.",

  // =========================
  // PERSONAGENS / NOMES
  // =========================
  "recipient.name":
    "Nome/apelido do destinatário. Deve aparecer em pontos-chave (verso 1 e refrão). Ajuda a ancorar personalização.",

  "recipient.babyName":
    "Nome do bebê: usar como símbolo de 'chegada/vida'. Pode ser repetido como mantra (com delicadeza) em refrões/outro.",

  "recipient.babyNickname":
    "Apelido carinhoso: bom para trechos suaves (ninar) e linhas curtas, melódicas, quase sussurradas.",

  "recipient.personality":
    "3 descrições não-clichês: virar imagem concreta e comportamento (como a pessoa age, reage, ilumina o ambiente). Evitar adjetivo vazio.",

  "recipient.specialCharacteristics":
    "Admiração específica: deve virar prova emocional (ações/hábitos/gestos) e sustentar versos com exemplos e cenas reais.",

  // =========================
  // NARRATIVA / MENSAGEM
  // =========================
  "lyricDetails.mainMessage":
    "Mensagem central. Deve virar a tese emocional da música e orientar o 'arco': passado → presente → futuro.",

  "lyricDetails.origin":
    "História de origem (como começou). Deve gerar a cena do passado (onde estavam, clima, detalhe sensorial).",

  "lyricDetails.relationshipHistory":
    "História da relação. Deve virar linha do tempo com marcos, contrastes e evolução (antes/depois).",

  "lyricDetails.turningPoint":
    "Momento do 'clique' do amor. Deve virar cena cinematográfica (microdetalhe: olhar, frase, lugar, gesto).",

  "lyricDetails.transformation":
    "Transformação pessoal. Deve mostrar mudança concreta (rotina, coragem, cura, maturidade) sem cair em 'você me mudou' genérico.",

  "lyricDetails.unsaid":
    "Verdade não dita. Deve virar o trecho mais vulnerável (ponte ou pré-refrão) com linguagem direta e humana.",

  "lyricDetails.feelings":
    "Mapa emocional cru. Deve orientar escolha de palavras, intensidade, pausas e progressão do clímax.",

  // =========================
  // CENAS / IMAGENS
  // =========================
  "lyricDetails.specialMentions":
    "Cena real marcante. Deve virar imagem específica com detalhes de lugar, ação, som, cheiro, hora do dia. Ideal para verso 1/2.",

  "lyricDetails.simpleScene":
    "Cena comum que é especial. Deve criar intimidade cotidiana (cozinha, carro, sofá, mensagens, rotinas) com carinho e verdade.",

  "lyricDetails.scene":
    "Cena-chave contextual (ex.: anúncio de gravidez, situação do tema 'outro'). Deve ser concreta e fácil de visualizar.",

  "lyricDetails.dailyScene":
    "Cena cotidiana especial na homenagem. Deve virar gesto recorrente (hábito/frase/cheiro) que o ouvinte 'enxerga'.",

  "lyricDetails.backstageScene":
    "Bastidores corporativos. Deve virar cena de cultura real (noite virada, reunião, atendimento, entrega) sem parecer propaganda.",

  "lyricDetails.markantScene":
    "Cena marcante do nascimento/gestação. Deve usar imagens de descoberta/ultrassom/abraço e emoção física (mãos tremendo, silêncio).",

  "lyricDetails.dreaming":
    "Cena sonhada com neto(a). Deve ser uma visualização futura calorosa (brincar, contar histórias, passear).",

  // =========================
  // DETALHES ÚNICOS / SEGREDOS
  // =========================
  "lyricDetails.secretDetail":
    "Segredo/piada interna. Deve virar referência sutil (1-2 linhas) para aumentar autenticidade; nunca explicar demais.",

  "lyricDetails.insideJoke":
    "Piada interna (amizade). Deve virar um 'easter egg' leve no verso, sem quebrar emoção.",

  "lyricDetails.uniqueDetail":
    "Detalhe único indispensável. Deve aparecer como objeto/símbolo/linha memorável e amarrar refrão ou ponte.",

  "lyricDetails.symbolicDetail":
    "Símbolo (objeto/lugar/frase). Deve virar metáfora recorrente (âncora poética) que reaparece com variação.",

  "lyricDetails.anchorWord":
    "Palavra-mantra (ninar). Deve virar repetição delicada, com sonoridade suave e sensação de segurança.",

  // =========================
  // FUTURO / DESEJOS / PROMESSAS
  // =========================
  "final.futureWish":
    "Desejo para o futuro. Deve criar a cena do futuro (sonhos, caminhos, bênção) e fechar com esperança.",

  "lyricDetails.futureVision":
    "Visão de futuro do casal. Deve ser concreta (casa, viagens, rotina, planos) e soar como compromisso real.",

  "lyricDetails.letterToFuture":
    "Carta para o futuro da criança. Deve virar versos com conselhos humanos e imagens de proteção/amor sem moralismo.",

  "lyricDetails.coreValue":
    "Valor principal a transmitir. Deve virar tema lírico (uma frase-chave) e orientar escolhas de metáfora e refrão.",

  "lyricDetails.messageToGrandchild":
    "Mensagem de legado para neto(a). Deve soar como passagem de bastão, com ternura e sabedoria simples.",

  "lyricDetails.familyTradition":
    "Tradição familiar. Deve virar imagem geracional (domingo, receita, música, história, ritual) conectando passado e futuro.",

  // =========================
  // FORMAS / FRASES-GANCHOS
  // =========================
  "lyricDetails.withYouI":
    "Frase-complemento 'Com você eu...'. Deve virar gancho melódico curto (pré-refrão/refrão) e conectar a um detalhe real.",

  "lyricDetails.announcementLine":
    "Linha de anúncio (gravidez). Deve ser uma revelação poética clara, ideal para o refrão ou virada do verso 2.",

  "lyricDetails.toast":
    "Brinde (amizade). Deve virar refrão celebrativo, com sensação de levantar o copo e lembrar de momentos vividos.",

  // =========================
  // CASAMENTO / PEDIDO
  // =========================
  "lyricDetails.proposalStyle":
    "Define função da música no pedido (pedido em si vs abrir espaço). Deve orientar clímax e a frase final.",

  "lyricDetails.certaintyCue":
    "Momento de certeza. Deve virar o ponto mais forte da narrativa (ponte/clímax), com frase inesquecível.",

  "lyricDetails.promises":
    "Promessas reais. Devem aparecer como linhas diretas, concretas, sem exagero; ótimas na ponte ou final do refrão.",

  "lyricDetails.ritual":
    "Ritual do casal. Deve virar imagem íntima recorrente (detalhe que 'só vocês fazem'), reforçando exclusividade.",

  // =========================
  // HOMENAGEM / MEMÓRIA
  // =========================
  "lyricDetails.biggestLesson":
    "Lição maior. Deve virar frase-guia (metáfora simples) e gerar gratidão madura, sem clichê.",

  "lyricDetails.invisibleSacrifice":
    "Sacrifício invisível. Deve virar emoção profunda (reconhecimento), com cuidado e respeito, sem vitimismo.",

  "lyricDetails.gratitude":
    "Agradecimento específico. Deve virar listas poéticas (2-4 itens) com cenas e detalhes, ideal para refrão ou verso 2.",

  "ai_metadata.lifeStatus":
    "Se é em vida ou em memória. Se for memória, permitir saudade e delicadeza; se em vida, focar em celebração e presença.",

  // =========================
  // AMIZADE
  // =========================
  "lyricDetails.proofMoment":
    "Momento que provou a amizade. Deve virar cena de lealdade (quando ficou, ajudou, segurou a barra).",

  "lyricDetails.sharedChallenge":
    "Desafio vencido juntos. Deve virar narrativa de superação compartilhada, sem melodrama excessivo.",

  "lyricDetails.admiredQuality":
    "Qualidade admirada. Deve virar exemplo concreto (como a pessoa age), com linguagem simples e honesta.",

  // =========================
  // CORPORATIVO
  // =========================
  "ai_metadata.audience":
    "Define público (time, clientes, evento, liderança). Deve ajustar linguagem (mais interna vs mais ampla) e evitar jargão.",

  "ai_metadata.audienceOther":
    "Público específico alternativo. Deve refinar para quem a música fala e quais imagens fazem sentido para esse grupo.",

  "ai_metadata.narratorRole":
    "Quem narra (fundador, liderança, time, institucional). Define voz e perspectiva (eu/nós/empresa).",

  "lyricDetails.mainChallenge":
    "Maior desafio da empresa. Deve virar tensão narrativa (quase desistimos, mas continuamos) sem soar 'autoajuda'.",

  "lyricDetails.cultureKeywords":
    "3 palavras de cultura. Devem se transformar em imagens e comportamentos (não slogans).",

  "lyricDetails.desiredImpact":
    "Objetivo da música (inspirar, celebrar, reforçar). Deve orientar refrão como mensagem coletiva e memorável.",

  // =========================
  // ORAÇÃO / ESPIRITUAL
  // =========================
  "ai_metadata.tradition":
    "Tradição espiritual. Define vocabulário permitido, símbolos e cuidado com referências (evitar clichês e excessos).",

  "lyricDetails.divineReference":
    "Como nomeia o divino (Deus, Universo, Senhor). Deve manter consistência e respeito; evitar mistura aleatória.",

  "ai_metadata.prayerIntention":
    "Intenção (gratidão/pedido/entrega). Define arco emocional: agradecer → pedir → confiar/entregar.",

  "lyricDetails.lifeContext":
    "Contexto de vida que levou à oração. Deve gerar cena do presente (dor, recomeço, busca) com humanidade.",

  "lyricDetails.centralIdea":
    "Ideia central (perdão, cura, luz). Deve virar mantra poético e sustentar refrões com simplicidade verdadeira.",

  "lyricDetails.spiritualReference":
    "Referência espiritual opcional (salmo, passagem). Deve inspirar clima e imagens sem copiar textos sagrados.",

  "lyricDetails.desiredFeeling":
    "Sensação predominante (paz, força, esperança, conexão). Deve orientar melodia verbal: palavras leves vs intensas.",

  // =========================
  // NASCIMENTO (FILHO)
  // =========================
  "ai_metadata.creatorRole":
    "Quem fala (pai/mãe/ambos/outro). Define voz narrativa e pronomes (eu/nós) e nível de intimidade.",

  "ai_metadata.birthStatus":
    "Se já nasceu ou ainda não. Se não nasceu: expectativa/sonho; se nasceu: presença, detalhes do agora.",

  "lyricDetails.firstFeeling":
    "Primeira emoção ao descobrir. Deve ser a 'faísca' do verso 1, com corpo (coração, mãos, silêncio, choro).",

  // =========================
  // NASCIMENTO (NETO)
  // =========================
  "ai_metadata.speakerRole":
    "Quem fala (avô/avó/ambos). Define tom (sabedoria, ternura) e imagens de legado.",

  "ai_metadata.primaryAddressee":
    "Para quem fala (neto, filho, ambos). Define se a letra chama a criança, o filho(a), ou alterna com coerência.",

  "lyricDetails.childBecomingParent":
    "Ver o filho(a) virar pai/mãe. Deve virar imagem de ciclo da vida, orgulho e emoção geracional.",

  // =========================
  // ANÚNCIO DE GRAVIDEZ
  // =========================
  "ai_metadata.pregnancyStage":
    "Estágio (acabou de descobrir, segredo, já contou). Define clima (sussurro/confidência vs celebração aberta).",

  // =========================
  // TEMA "OUTRO" (ABERTO)
  // =========================
  "ai_metadata.hasCentralPerson":
    "Se existe uma pessoa central. Se sim, usar nome e relação; se não, focar em evento/tema/transformação.",

  // =========================
  // NINAR / SONO
  // =========================
  "lyricDetails.sensation":
    "Sensação-base (segurança/paz/aconchego). Deve orientar palavras macias, repetição suave e imagens protetoras.",

  "lyricDetails.sleepPurpose":
    "Propósito na hora de dormir. Deve virar frases de colo (tudo bem, estou aqui), com ritmo calmo e previsível.",

  // =========================
  // CONTROLES MUSICAIS (usados em vários temas)
  // =========================
  "musicStyle.primaryGenre":
    "Gênero escolhido. Deve guiar escolhas de rima, vocabulário, estrutura (verso/refrão/ponte) e intensidade do texto.",

  "musicStyle.primaryGenreOther":
    "Gênero alternativo especificado. Deve refinar subgênero e estética (ex.: samba, funk, bossa, eletrônico).",

  "musicStyle.mood":
    "Impacto emocional desejado (emocionar, paz, arrepio, sorriso, esperança, força). Deve influenciar imagens e clímax.",

  "musicStyle.tempo":
    "Movimento/andamento (calma, equilibrada, intensa, meditativa). Deve afetar tamanho das frases, pausas e densidade.",

  "productionDetails.vocalApproach":
    "Tipo de voz (masc/fem/dueto/coral). Deve orientar tessitura lírica: palavras curtas vs longas, refrão mais aberto, etc.",

  // =========================
  // RESTRIÇÕES / EVITAR
  // =========================
  "lyricDetails.avoid":
    "Coisas a evitar (clichês, termos, temas). Deve virar 'negative constraints' para manter autenticidade e segurança emocional.",
};
