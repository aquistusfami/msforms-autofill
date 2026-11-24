const ext = globalThis.browser || globalThis.chrome;
const STORAGE_KEY = 'msforms_autofill_cfg_v2';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

const PRESET_HINTS = {
  positive: 'Rất hài lòng 42%, Hài lòng 46%, Bình thường 12% • Điểm 8–10.',
  neutral: 'Bình thường 47%, Hài lòng 37%, rải nhẹ hai bên 16% • Điểm 6–8.',
  negative: 'Không hài lòng 47%, Rất không hài lòng 35%, Bình thường 18% • Điểm 2–5.',
  custom: 'Chọn ngẫu nhiên đều trong các cột bạn tick bên dưới.',
};

function syncPresetUI() {
  const val = $('preset').value;
  $('customBox').classList.toggle('hidden', val !== 'custom');
  $('presetHint').textContent = PRESET_HINTS[val] || '';
}

function readConfig() {
  const likertLevels = [...document.querySelectorAll('input[name="lvl"]:checked')].map((el) =>
    Number(el.value)
  );
  return {
    preset: $('preset').value,
    likertLevels,
    naKeywords: $('naKeywords').value,
    singleMode: $('singleMode').value,
    npsMode: $('npsMode').value,
    skipChecked: $('skipChecked').checked,
  };
}

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) {
      if (saved.preset) $('preset').value = saved.preset;
      if (Array.isArray(saved.likertLevels)) {
        for (const el of document.querySelectorAll('input[name="lvl"]')) {
          el.checked = saved.likertLevels.includes(Number(el.value));
        }
      }
      if (typeof saved.naKeywords === 'string') $('naKeywords').value = saved.naKeywords;
      if (saved.singleMode) $('singleMode').value = saved.singleMode;
      if (saved.npsMode) $('npsMode').value = saved.npsMode;
      if (typeof saved.skipChecked === 'boolean') $('skipChecked').checked = saved.skipChecked;
    }
  } catch (_) {}
  syncPresetUI();
}

function setStatus(msg, isErr = false) {
  statusEl.textContent = msg;
  statusEl.className = isErr ? 'err' : '';
}

$('preset').addEventListener('change', syncPresetUI);
loadConfig();

$('runBtn').addEventListener('click', async () => {
  const cfg = readConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));

  if (cfg.preset === 'custom' && !cfg.likertLevels.length && cfg.singleMode === 'skip' && cfg.npsMode === 'skip') {
    setStatus('Chưa chọn mục nào để điền.', true);
    return;
  }

  try {
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Không tìm thấy tab đang mở.');

    const results = await ext.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: fillMsForm,
      args: [cfg],
    });

    const total = (results || []).reduce(
      (acc, r) => {
        if (!r?.result) return acc;
        acc.likert += r.result.likert || 0;
        acc.single += r.result.single || 0;
        acc.nps += r.result.nps || 0;
        acc.skipped += r.result.skipped || 0;
        return acc;
      },
      { likert: 0, single: 0, nps: 0, skipped: 0 }
    );

    setStatus(
      `Xong: ${total.likert} Likert, ${total.single} câu chọn, ${total.nps} thang điểm (bỏ qua ${total.skipped}).`
    );
  } catch (err) {
    setStatus(`Lỗi: ${err?.message || err}`, true);
  }
});
