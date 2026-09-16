/* NRCME Memory Palace — question renderer (card pages + practice page)
   renderQuiz(container, questions, { base, showCard, cards, onScore }) */
(function () {
  const LETTERS = ['A', 'B', 'C', 'D'];
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function renderQuiz(container, questions, opts) {
    opts = opts || {};
    const base = opts.base || '.';
    const state = { answered: 0, correct: 0, total: questions.length };
    container.innerHTML = '';
    questions.forEach((q, idx) => {
      const el = document.createElement('article'); el.className = 'q'; el.id = q.id;
      const cardLink = (opts.showCard && opts.cards && opts.cards[q.card])
        ? `<a href="${base}/cards/${String(q.card).padStart(2, '0')}/">From Card ${q.card} · ${esc(opts.cards[q.card])}</a>` : `<span>${esc(q.topic)}</span>`;
      el.innerHTML = `
        <div class="qtop"><span><span class="qn">${idx + 1}</span> &nbsp;${esc(q.topic)}</span>${opts.showCard ? cardLink : ''}</div>
        <p class="stem">${esc(q.stem)}</p>
        <div class="opts" role="group" aria-label="Answer choices"></div>
        <div class="expl" aria-live="polite">
          <div class="verdict"></div>
          <p>${esc(q.explanation)}</p>
          <div class="srcs"><span class="lbl">Source type</span><p><span class="tag ${esc(q.tag)}">${esc(q.tag)}</span> &nbsp;${esc(q.tagLabel)}</p>
            <span class="lbl">References</span><ul>${q.sources.map(s => s.url ? `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>` : `<li>${esc(s.label)}</li>`).join('')}</ul></div>
          <a class="cheat" href="${base}/cheatsheet/${esc(q.cheat.page)}/#${esc(q.cheat.anchor)}">📖 Where this is in the cheat sheet: ${esc(q.cheat.label)} →</a>
        </div>`;
      const opts_el = el.querySelector('.opts');
      q.options.forEach((o, k) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'opt';
        b.innerHTML = `<span class="k">${LETTERS[k]}</span><span>${esc(o)}</span>`;
        b.addEventListener('click', () => answer(el, q, k));
        opts_el.appendChild(b);
      });
      container.appendChild(el);
    });

    function answer(el, q, k) {
      const btns = [...el.querySelectorAll('.opt')];
      btns.forEach((b, i) => { b.disabled = true; if (i === q.answer) b.classList.add('correct'); else if (i === k) b.classList.add('wrong'); else b.classList.add('dim'); });
      const ok = k === q.answer;
      const v = el.querySelector('.verdict'); v.textContent = ok ? 'Correct.' : `Not quite — the answer is ${LETTERS[q.answer]}.`; v.className = 'verdict ' + (ok ? 'ok' : 'no');
      el.querySelector('.expl').classList.add('show');
      state.answered++; if (ok) state.correct++;
      if (opts.onScore) opts.onScore(state);
      if (state.answered === state.total) { try { document.dispatchEvent(new CustomEvent('mp:quizfinished', { detail: { card: opts.card === undefined ? null : opts.card, correct: state.correct, total: state.total } })); } catch (e) {} }
    }
    return state;
  }

  function loadQuestions(base) {
    return fetch(base + '/data/questions.json').then(r => r.json());
  }

  window.MPQuiz = { renderQuiz, loadQuestions, shuffle };
})();
