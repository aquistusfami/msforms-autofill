function fillMsForm(cfg) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pickWeighted = (pairs) => {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [val, w] of pairs) {
      r -= w;
      if (r <= 0) return val;
    }
    return pairs[pairs.length - 1][0];
  };
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  // Attitude profiles: [columnIndex, weight] where 0=Rất hài lòng .. 4=Rất không hài lòng
  const PROFILES = {
    positive: {
      likert: [[0, 42], [1, 46], [2, 12]],
      nps: [[8, 35], [9, 45], [10, 20]],
    },
    neutral: {
      likert: [[0, 8], [1, 37], [2, 47], [3, 8]],
      nps: [[6, 25], [7, 50], [8, 25]],
    },
    negative: {
      likert: [[2, 18], [3, 47], [4, 35]],
      nps: [[2, 20], [3, 35], [4, 30], [5, 15]],
    },
  };

  const profile = PROFILES[cfg.preset] || null;
  const naKeywords = (cfg.naKeywords || '')
    .split(',')
    .map(norm)
    .filter(Boolean);

  const stats = { likert: 0, single: 0, nps: 0, skipped: 0 };

  const groups = new Map();
  for (const el of document.querySelectorAll('input[type="radio"][name]')) {
    if (!groups.has(el.name)) groups.set(el.name, []);
    groups.get(el.name).push(el);
  }

  // Track chosen indices per question block so "tổng thể / overall" rows stay consistent
  const sectionScores = new Map();
  const getSectionKey = (el) => {
    const box = el.closest?.('[data-automation-id="questionItem"], [role="listitem"], fieldset');
    return box || 'default';
  };

  for (const [name, opts] of groups) {
    if (!opts.length) continue;
    if (cfg.skipChecked && opts.some((o) => o.checked)) {
      stats.skipped++;
      continue;
    }

    if (name.startsWith('row_')) {
      const labelText = norm(opts[0].getAttribute('aria-label'));
      const isNaRow =
        naKeywords.length > 0 &&
        opts.length >= 6 &&
        naKeywords.some((kw) => labelText.includes(kw));

      let idx;
      if (isNaRow) {
        idx = opts.length - 1;
      } else if (profile) {
        const secKey = getSectionKey(opts[0]);
        const prev = sectionScores.get(secKey) || [];
        const isOverall = labelText.includes('tổng thể') || labelText.includes('overall');
        if (isOverall && prev.length >= 2) {
          const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
          idx = Math.max(0, Math.min(4, Math.round(avg)));
        } else {
          const valid = profile.likert.filter(([i]) => i < opts.length);
          idx = valid.length ? pickWeighted(valid) : 0;
        }
        if (idx < 5) {
          prev.push(idx);
          sectionScores.set(secKey, prev);
        }
      } else {
        if (!cfg.likertLevels || !cfg.likertLevels.length) continue;
        const valid = cfg.likertLevels.filter((i) => i >= 0 && i < opts.length);
        idx = valid.length ? pick(valid) : Math.min(cfg.likertLevels[0], opts.length - 1);
      }

      if (opts[idx]) {
        opts[idx].click();
        stats.likert++;
      }
    } else {
      if (cfg.singleMode === 'skip') continue;
      const target = cfg.singleMode === 'first' ? opts[0] : pick(opts);
      if (target) {
        target.click();
        stats.single++;
      }
    }
  }

  if (cfg.npsMode !== 'skip') {
    const scale = [...document.querySelectorAll('[role="radio"]:not(input)')].filter((el) =>
      /^([1-9]|10)$/.test((el.textContent || '').trim())
    );
    if (scale.length) {
      const already = scale.some((el) => el.getAttribute('aria-checked') === 'true');
      if (cfg.skipChecked && already) {
        stats.skipped++;
      } else {
        let want;
        if (cfg.npsMode === 'auto' && profile) {
          want = String(pickWeighted(profile.nps));
        } else if (cfg.npsMode === 'auto' || cfg.npsMode === 'random8_10') {
          want = String(pick([8, 9, 10]));
        } else if (cfg.npsMode === 'random') {
          want = String(pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
        } else {
          want = String(cfg.npsMode);
        }
        const target = scale.find((el) => (el.textContent || '').trim() === want);
        if (target) {
          target.click();
          stats.nps++;
        }
      }
    }
  }

  return stats;
}

if (typeof module !== 'undefined') {
  module.exports = { fillMsForm };
}
