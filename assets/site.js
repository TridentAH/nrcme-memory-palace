/* NRCME Memory Palace — shared site script: per-viewer progress memory (localStorage; falls back silently) */
(function () {
  const KEY = 'mp_progress_v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function card(n) { const p = load(); return p['c' + n] || {}; }
  function setCard(n, patch) { const p = load(); p['c' + n] = Object.assign({}, p['c' + n] || {}, patch, { at: Date.now() }); save(p); render(); }
  function setQuiz(correct, total) { const p = load(); p.quiz = { correct, total, at: Date.now() }; save(p); render(); }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} render(); }

  function badge(c) {
    const parts = [];
    if (c.done) parts.push('✓ Watched');
    if (c.score) parts.push(`${c.score.correct}/${c.score.total} on the quiz`);
    return parts.join(' · ');
  }

  function render() {
    // deck grids: <a class="deck-card" data-card="N"> … <div class="meta">
    document.querySelectorAll('[data-card-progress]').forEach(el => {
      const n = parseInt(el.getAttribute('data-card-progress'), 10);
      const c = card(n); const text = badge(c);
      el.textContent = text; el.hidden = !text;
      const host = el.closest('.deck-card'); if (host) host.classList.toggle('is-done', !!c.done);
    });
    // card page status line
    const st = document.getElementById('cardStatus');
    if (st) {
      const n = parseInt(st.getAttribute('data-card'), 10); const c = card(n); const text = badge(c);
      st.textContent = text || 'Not started — press play, then try the questions.';
      const btn = document.getElementById('markDone'); if (btn) btn.textContent = c.done ? 'Watched ✓ (click to clear)' : 'Mark as watched';
    }
    // overall counters (landing / overview)
    document.querySelectorAll('[data-progress-summary]').forEach(el => {
      const p = load(); let done = 0, quizzed = 0;
      for (let i = 0; i < 14; i++) { const c = p['c' + i] || {}; if (c.done) done++; if (c.score) quizzed++; }
      if (!done && !quizzed) { el.hidden = true; return; }
      el.hidden = false;
      el.querySelector('[data-done]').textContent = done;
      el.querySelector('[data-quizzed]').textContent = quizzed;
    });
    const lq = document.getElementById('lastQuiz');
    if (lq) { const q = load().quiz; lq.textContent = q ? `Last random quiz: ${q.correct}/${q.total} (${Math.round(q.correct / q.total * 100)}%)` : ''; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    const btn = document.getElementById('markDone');
    if (btn) btn.addEventListener('click', () => { const n = parseInt(btn.getAttribute('data-card'), 10); setCard(n, { done: !card(n).done }); });
    document.querySelectorAll('[data-progress-reset]').forEach(b => b.addEventListener('click', () => { if (confirm('Clear your progress on this device?')) reset(); }));
  });
  document.addEventListener('mp:cardfinished', e => setCard(e.detail.card, { done: true }));
  document.addEventListener('mp:quizfinished', e => { if (e.detail.card !== undefined && e.detail.card !== null) setCard(e.detail.card, { score: { correct: e.detail.correct, total: e.detail.total } }); else setQuiz(e.detail.correct, e.detail.total); });

  window.MPProgress = { card, setCard, setQuiz, reset, render };
})();
