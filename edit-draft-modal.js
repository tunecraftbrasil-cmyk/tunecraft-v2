let editDraftCurrentPedidoId = null;

// Garantir cliente Supabase disponível (pode já existir via dashboard)
if (!window.sb) {
  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function openEditDraftModal(pedidoId) {
  editDraftCurrentPedidoId = pedidoId;
  document.getElementById('editDraftModal').classList.add('active');
  loadEditDraft();
}

function closeEditDraftModal() {
  document.getElementById('editDraftModal').classList.remove('active');
  editDraftCurrentPedidoId = null;
}

document.getElementById('editDraftModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('editDraftModal')) {
    closeEditDraftModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('editDraftModal').classList.contains('active')) {
    closeEditDraftModal();
  }
});

async function loadEditDraft() {
  try {
    const { data, error } = await window.sb
      .from('musicas_pedidos')
      .select('payload, created_at')
      .eq('id', editDraftCurrentPedidoId)
      .single();
    if (error || !data) {
      closeEditDraftModal();
      return;
    }

    preencherEditDraftForm(data.payload);
    document.getElementById('editDraftHeaderInfo').innerHTML = `
      Rascunho ID: <strong>${editDraftCurrentPedidoId.substring(0, 8)}...</strong> |
      Criado em: <strong>${new Date(data.created_at).toLocaleDateString('pt-BR')}</strong>
    `;
    document.getElementById('editDraftLoading').style.display = 'none';
    document.getElementById('editDraftForm').style.display = 'block';
  } catch {
    closeEditDraftModal();
  }
}

function preencherEditDraftForm(payload) {
  for (let i = 1; i <= 16; i++) {
    const elem = document.getElementById(`editDraft_step${i}`);
    if (elem && payload[`step${i}`]) {
      elem.value = payload[`step${i}`];
    }
  }

  if (payload.step1_5) document.getElementById('editDraft_step1_5').value = payload.step1_5;
  if (payload.step6_5) document.getElementById('editDraft_step6_5').value = payload.step6_5;
  if (payload.step8_5) document.getElementById('editDraft_step8_5').value = payload.step8_5;

  const refsContainer = document.getElementById('editDraftReferencesContainer');
  refsContainer.innerHTML = '';
  const refs = payload.step11 || [{}, {}, {}];
  for (let i = 0; i < 3; i++) {
    const ref = refs[i] || {};
    refsContainer.innerHTML += `
      <div class="edit-draft-reference-item">
        <input type="text" id="editDraft_ref_artist_${i}" placeholder="Artista" value="${ref.artist || ''}" />
        <input type="text" id="editDraft_ref_song_${i}" placeholder="Música" value="${ref.song || ''}" />
      </div>
    `;
  }

  atualizarEditDraftCamposCondicionais();
}

function atualizarEditDraftCamposCondicionais() {
  const step1 = document.getElementById('editDraft_step1').value;
  document.getElementById('editDraft_step1_5_group').style.display = step1 === 'other' ? 'block' : 'none';

  const step6 = document.getElementById('editDraft_step6').value;
  document.getElementById('editDraft_step6_5_group').style.display = step6 === 'other' ? 'block' : 'none';

  const step8 = document.getElementById('editDraft_step8').value;
  document.getElementById('editDraft_step8_5_group').style.display = step8 === 'other' ? 'block' : 'none';
}

document.getElementById('editDraft_step1').addEventListener('change', atualizarEditDraftCamposCondicionais);
document.getElementById('editDraft_step6').addEventListener('change', atualizarEditDraftCamposCondicionais);
document.getElementById('editDraft_step8').addEventListener('change', atualizarEditDraftCamposCondicionais);

document.getElementById('editDraftForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const newPayload = {};
    for (let i = 1; i <= 16; i++) {
      const elem = document.getElementById(`editDraft_step${i}`);
      if (elem) {
        const value = elem.value.trim();
        if (value) newPayload[`step${i}`] = value;
      }
    }
    const val1_5 = document.getElementById('editDraft_step1_5')?.value.trim();
    if (val1_5) newPayload.step1_5 = val1_5;
    const val6_5 = document.getElementById('editDraft_step6_5')?.value.trim();
    if (val6_5) newPayload.step6_5 = val6_5;
    const val8_5 = document.getElementById('editDraft_step8_5')?.value.trim();
    if (val8_5) newPayload.step8_5 = val8_5;

    const refs = [];
    for (let i = 0; i < 3; i++) {
      const artist = document.getElementById(`editDraft_ref_artist_${i}`)?.value.trim();
      const song = document.getElementById(`editDraft_ref_song_${i}`)?.value.trim();
      if (artist || song) refs.push({ artist, song });
    }
    if (refs.length) newPayload.step11 = refs;

    await window.sb
      .from('musicas_pedidos')
      .update({
        payload: newPayload,
        updated_at: new Date().toISOString()
      })
      .eq('id', editDraftCurrentPedidoId);

    closeEditDraftModal();
    if (window.renderSections) {
      userData.orders = await loadOrdersFromSupabase();
      localStorage.setItem('tuneCraftUser', JSON.stringify(userData));
      renderSections();
    }
  } catch {
    closeEditDraftModal();
  }
});

function showEditDraftToast(message, type = 'info') {
  const toast = document.getElementById('editDraftToast');
  toast.textContent = message;
  toast.className = `edit-draft-toast ${type}`;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}
