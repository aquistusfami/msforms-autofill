const assert = require('node:assert/strict');
const { fillMsForm } = require('./fill.js');

function makeEl({ tag, type, role, name, ariaLabel, text, section }) {
  return {
    tagName: tag,
    type: type || '',
    name: name || '',
    checked: false,
    textContent: text || '',
    _attrs: { role: role || null, 'aria-label': ariaLabel || null, 'aria-checked': 'false' },
    getAttribute(k) { return this._attrs[k] ?? null; },
    closest() { return section || null; },
    click() {
      if (this.type === 'radio') this.checked = true;
      else this._attrs['aria-checked'] = 'true';
    },
  };
}

function buildMock(rowCount = 30) {
  const sec = { id: 'sec1' };
  const radios = [];
  for (let r = 0; r < rowCount; r++) {
    const label = r === rowCount - 1 ? 'Mức độ hài lòng tổng thể' : `Tiêu chí ${r}`;
    for (let c = 0; c < 6; c++) {
      radios.push(makeEl({ tag: 'INPUT', type: 'radio', name: `row_${r}`, ariaLabel: `${label} opt${c}`, section: sec }));
    }
  }
  const nps = Array.from({ length: 10 }, (_, i) => makeEl({ tag: 'DIV', role: 'radio', text: String(i + 1) }));
  global.document = {
    querySelectorAll(sel) {
      if (sel === 'input[type="radio"][name]') return radios;
      if (sel === '[role="radio"]:not(input)') return nps;
      return [];
    },
  };
  return { radios, nps };
}

function chosenIndices(radios) {
  const byRow = new Map();
  for (const r of radios) {
    if (!byRow.has(r.name)) byRow.set(r.name, []);
    byRow.get(r.name).push(r);
  }
  return [...byRow.values()].map((opts) => opts.findIndex((o) => o.checked));
}

// 1. Positive preset: all picks in [0,1,2], NPS in [8,9,10]
{
  const { radios, nps } = buildMock(40);
  fillMsForm({ preset: 'positive', naKeywords: '', singleMode: 'skip', npsMode: 'auto', skipChecked: true });
  const picks = chosenIndices(radios);
  assert.ok(picks.every((i) => i >= 0 && i <= 2), `positive out of range: ${picks}`);
  const score = nps.findIndex((e) => e.getAttribute('aria-checked') === 'true') + 1;
  assert.ok(score >= 8 && score <= 10, `positive NPS out of range: ${score}`);
}

// 2. Neutral preset: all picks in [0..3], NPS in [6..8]
{
  const { radios, nps } = buildMock(40);
  fillMsForm({ preset: 'neutral', naKeywords: '', singleMode: 'skip', npsMode: 'auto', skipChecked: true });
  const picks = chosenIndices(radios);
  assert.ok(picks.every((i) => i >= 0 && i <= 3), `neutral out of range: ${picks}`);
  const score = nps.findIndex((e) => e.getAttribute('aria-checked') === 'true') + 1;
  assert.ok(score >= 6 && score <= 8, `neutral NPS out of range: ${score}`);
}

// 3. Negative preset: all picks in [2,3,4], NPS in [2..5]
{
  const { radios, nps } = buildMock(40);
  fillMsForm({ preset: 'negative', naKeywords: '', singleMode: 'skip', npsMode: 'auto', skipChecked: true });
  const picks = chosenIndices(radios);
  assert.ok(picks.every((i) => i >= 2 && i <= 4), `negative out of range: ${picks}`);
  const score = nps.findIndex((e) => e.getAttribute('aria-checked') === 'true') + 1;
  assert.ok(score >= 2 && score <= 5, `negative NPS out of range: ${score}`);
}

// 4. Custom + NA keyword + skipChecked
{
  const sec = { id: 's' };
  const radios = [
    ...Array.from({ length: 6 }, (_, i) => makeEl({ tag: 'INPUT', type: 'radio', name: 'row_ktx', ariaLabel: `Ký túc xá ${i}`, section: sec })),
    ...Array.from({ length: 3 }, (_, i) => makeEl({ tag: 'INPUT', type: 'radio', name: 'q13', text: `o${i}` })),
  ];
  global.document = { querySelectorAll: (s) => (s === 'input[type="radio"][name]' ? radios : []) };
  const r1 = fillMsForm({ preset: 'custom', likertLevels: [1], naKeywords: 'ký túc xá', singleMode: 'first', npsMode: 'skip', skipChecked: true });
  assert.deepEqual(r1, { likert: 1, single: 1, nps: 0, skipped: 0 });
  assert.equal(radios[5].checked, true, 'KTX row should pick Không đánh giá');
  const r2 = fillMsForm({ preset: 'positive', naKeywords: '', singleMode: 'random', npsMode: 'skip', skipChecked: true });
  assert.deepEqual(r2, { likert: 0, single: 0, nps: 0, skipped: 2 });
}

console.log('ALL_TESTS_PASSED');
