const EDIT_DRAFT_SELECT_FIELDS = {
  'ai_metadata.themeId': 'themes',
  'ai_metadata.relationship': 'relationships',
  'ai_metadata.audience': 'audiences',
  'ai_metadata.narratorRole': 'narratorRoles',
  'ai_metadata.pregnancyStage': 'pregnancyStages',
  'ai_metadata.pov': 'povs',
  'musicStyle.primaryGenre': 'genres',
  'musicStyle.mood': 'moods',
  'musicStyle.tempo': 'tempos',
  'lyricDetails.language': 'languages',
  'productionDetails.vocalApproach': 'vocalApproaches',
  'recipient.ageGroup': 'ageGroups'
};

let editDraftCurrentPedidoId = null;
let editDraftAskedCache = [];
let editDraftPayloadBase = null;

function ensureSupabaseClient() {
  if (!window.sb && window.supabase) {
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

function openEditDraftModal(pedidoId) {
  editDraftSelectCache = null;
  editDraftCurrentPedidoId = pedidoId;
  const modal = document.getElementById('editDraftModal');
  if (modal) modal.classList.add('active');
  loadEditDraft();
}

function closeEditDraftModal() {
  const modal = document.getElementById('editDraftModal');
  if (modal) modal.classList.remove('active');
  editDraftCurrentPedidoId = null;
  editDraftAskedCache = [];
  editDraftPayloadBase = null;
}

function showEditDraftToast(message, type = 'info') {
  const toast = document.getElementById('editDraftToast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `edit-draft-toast ${type}`;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

let editDraftSelectCache = null;

function buildSelectCacheFromFlow() {
  const flow = window.elaboratedChatFlow || [];
  const map = {};
  flow.forEach((step) => {
    const fieldName = step?.metadata?.fieldName;
    if (step?.type !== 'select' || !fieldName || !Array.isArray(step.options)) return;
    if (!map[fieldName]) map[fieldName] = [];
    step.options.forEach((opt) => {
      if (!map[fieldName].some((o) => o.value === opt.value)) {
        map[fieldName].push({ label: opt.label, value: opt.value });
      }
    });
  });
  return map;
}

function getSelectOptions(fieldName) {
  const flow = globalThis.elaboratedChatFlow || window.elaboratedChatFlow || [];
  const collected = [];
  flow.forEach((step) => {
    const stepField = step?.metadata?.fieldName;
    if (step?.type !== 'select' || stepField !== fieldName || !Array.isArray(step.options)) return;
    step.options.forEach((opt) => {
      if (!collected.some((o) => o.value === opt.value)) {
        collected.push({ label: opt.label, value: opt.value });
      }
    });
  });

  if (!collected.length) {
    const groupKey = EDIT_DRAFT_SELECT_FIELDS[fieldName];
    const fallbackRoot = (typeof FORMOPTIONS !== 'undefined') ? FORMOPTIONS : (window.FORMOPTIONS || {});
    const fallback = fallbackRoot[groupKey] || [];
    if (fallback.length) return fallback;
  }

  return collected;
}
function renderSelectField(fieldId, fieldName, currentValue, options) {
  const normalizedValue = currentValue ?? '';
  const list = Array.isArray(options) ? options : [];
  const hasMatch = list.some((opt) => opt.value === normalizedValue);
  let html = `<select id="${fieldId}">`;

  if (!list.length) {
    const label = normalizedValue ? normalizedValue : 'Selecione';
    html += `<option value="${normalizedValue}" selected>${label}</option>`;
  } else {
    list.forEach((opt) => {
      const selected = opt.value === normalizedValue ? 'selected' : '';
      html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
    });
    if (normalizedValue && !hasMatch) {
      html += `<option value="${normalizedValue}" selected>${normalizedValue}</option>`;
    }
  }

  html += '</select>';
  return html;
}

function flattenAnswers(answers) {
  const items = [];
  if (!answers || typeof answers !== 'object') return items;
  Object.entries(answers).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([childKey, childValue]) => {
        items.push({
          fieldName: `${key}.${childKey}`,
          section: key,
          question: `${key}.${childKey}`,
          answerValue: childValue
        });
      });
    } else {
      items.push({
        fieldName: key,
        section: 'Respostas',
        question: key,
        answerValue: value
      });
    }
  });
  return items;
}

function renderEditDraftForm(payload) {
  const form = document.getElementById('editDraftForm');
  if (!form) return;

  let asked = Array.isArray(payload.asked) ? payload.asked : [];
  const answers = payload.answers || {};
  if (!asked.length) {
    asked = flattenAnswers(answers);
  }
  editDraftAskedCache = asked;
  editDraftPayloadBase = payload;

  let formHTML = '';
  let currentSection = '';

  asked.forEach((item, index) => {
    const sectionTitle = item.section || 'Perguntas';
    if (sectionTitle !== currentSection) {
      currentSection = sectionTitle;
      formHTML += `<div class="edit-draft-section-title">${sectionTitle}</div>`;
    }

    const fieldName = item.fieldName || `campo_${index}`;
    const fieldId = `edit_${fieldName.replace(/\./g, '_')}`;
    const fieldValue = item.answerValue || '';
    const labelText = item.question || fieldName;

    formHTML += `
      <div class="edit-draft-form-group">
        <label>${labelText}</label>
        <div class="field-name">${fieldName}</div>
    `;

    const selectOptions = getSelectOptions(fieldName);
    if (selectOptions.length) {
      formHTML += renderSelectField(fieldId, fieldName, fieldValue, selectOptions);
    } else if (typeof fieldValue === 'string' && fieldValue.length > 60) {
      formHTML += `<textarea id="${fieldId}" rows="3">${escapeHtml(fieldValue)}</textarea>`;
    } else {
      formHTML += `<input type="text" id="${fieldId}" value="${escapeHtml(fieldValue)}" />`;
    }

    formHTML += '</div>';
  });

  formHTML += `
    <div class="edit-draft-actions">
      <button type="button" class="edit-draft-btn edit-draft-btn-cancel" onclick="closeEditDraftModal()">Cancelar</button>
      <button type="button" class="edit-draft-btn edit-draft-btn-save" id="editDraftSaveBtn" onclick="saveEditDraftDynamic()">Salvar Altera&ccedil;&otilde;es</button>
    </div>
  `;

  form.innerHTML = formHTML;
}
async function loadEditDraft() {
  try {
    ensureSupabaseClient();
    const loading = document.getElementById('editDraftLoading');
    const form = document.getElementById('editDraftForm');
    if (loading) loading.style.display = 'flex';
    if (form) form.style.display = 'none';

    const { data, error } = await window.sb
      .from('musicas_pedidos')
      .select('payload, created_at')
      .eq('id', editDraftCurrentPedidoId)
      .single();

    if (error || !data) {
      closeEditDraftModal();
      return;
    }

    renderEditDraftForm(data.payload || {});

    const header = document.getElementById('editDraftHeaderInfo');
    if (header) {
      header.innerHTML = `
        Rascunho ID: <strong>${editDraftCurrentPedidoId.substring(0, 8)}...</strong> |
        Criado em: <strong>${new Date(data.created_at).toLocaleDateString('pt-BR')}</strong>
      `;
    }

    if (loading) loading.style.display = 'none';
    if (form) form.style.display = 'block';
  } catch {
    closeEditDraftModal();
  }
}

async function saveEditDraftDynamic() {
  if (!editDraftCurrentPedidoId || !editDraftAskedCache.length) return;
  const btn = document.getElementById('editDraftSaveBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Salvando...';
  }

  try {
    ensureSupabaseClient();
    const updatedAnswers = {};

    editDraftAskedCache.forEach((item) => {
      const fieldName = item.fieldName;
      const fieldId = `edit_${fieldName.replace(/\./g, '_')}`;
      const input = document.getElementById(fieldId);
      if (!input) return;

      const value = input.value || input.textContent || '';
      const parts = fieldName.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        if (!updatedAnswers[parent]) updatedAnswers[parent] = {};
        updatedAnswers[parent][child] = value;
      } else {
        updatedAnswers[fieldName] = value;
      }
    });

    const payload = {
      ...(editDraftPayloadBase || {}),
      asked: editDraftAskedCache,
      answers: updatedAnswers,
      updated_at: new Date().toISOString()
    };

    const { error } = await window.sb
      .from('musicas_pedidos')
      .update({ payload })
      .eq('id', editDraftCurrentPedidoId);

    if (error) throw error;

    showEditDraftToast('Rascunho atualizado com sucesso!', 'success');
    closeEditDraftModal();

    if (window.renderSections) {
      userData.orders = await loadOrdersFromSupabase();
      localStorage.setItem('tuneCraftUser', JSON.stringify(userData));
      renderSections();
    }
  } catch (err) {
    showEditDraftToast(`Erro: ${err.message || err}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Salvar Altera&ccedil;&otilde;es';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('editDraftModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEditDraftModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      closeEditDraftModal();
    }
  });
});
