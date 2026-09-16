/* NRCME Memory Palace — card player (image + narration + spotlight)
   Expects window.CARD = { id, title, img, regions:{n:[x,y,w,h]}, segs:[{audio, dur, callouts:[n], html}], prev, next } */
(function () {
  const C = window.CARD;
  if (!C) return;
  const $ = (id) => document.getElementById(id);
  const scene = $('scene'), spot = $('spot'), ring = $('ring'), script = $('script'),
        playBtn = $('play'), fill = $('fill'), timeEl = $('time'), rateSel = $('rate'), bar = $('bar');
  const GAP = 0.6;               // pause between segments (s) — matches the review player
  let cur = 0, playing = false, timer = null, paras = [], token = 0;
  const audio = new Audio();      // one element: unlocked by the first user gesture, reused for every segment
  audio.preload = 'auto';
  const total = C.segs.reduce((a, s) => a + s.dur + GAP, 0);

  function fmt(t) { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  function before(i) { let a = 0; for (let k = 0; k < i; k++) a += C.segs[k].dur + GAP; return a; }
  function setSpot(b) { [spot, ring].forEach(el => { el.setAttribute('x', b[0]); el.setAttribute('y', b[1]); el.setAttribute('width', b[2]); el.setAttribute('height', b[3]); }); }

  function light(i) {
    paras.forEach((p, k) => { p.classList.toggle('on', k === i); p.classList.toggle('done', k < i); });
    if (!document.body.classList.contains('focus')) {
      const el = paras[i];
      script.scrollTo({ top: el.offsetTop - script.clientHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
    }
    const cs = C.segs[i].callouts, R = C.regions;
    const r = cs.length ? R[cs[0]] : null;
    if (!r) { scene.classList.remove('lit'); setSpot([0, 0, 100, 100]); return; }
    let box = r.slice();
    cs.forEach(n => { const q = R[n]; if (!q) return;
      const x2 = Math.max(box[0] + box[2], q[0] + q[2]), y2 = Math.max(box[1] + box[3], q[1] + q[3]);
      box[0] = Math.min(box[0], q[0]); box[1] = Math.min(box[1], q[1]); box[2] = x2 - box[0]; box[3] = y2 - box[1]; });
    scene.classList.add('lit'); setSpot(box);
  }

  function tick() {
    const e = before(cur) + (audio.currentTime || 0);
    fill.style.width = (e / total * 100) + '%';
    timeEl.textContent = fmt(e) + ' / ' + fmt(total);
  }

  function play() {
    if (cur >= C.segs.length) cur = 0;
    playing = true; playBtn.textContent = '❚❚ Pause'; playBtn.setAttribute('aria-label', 'Pause narration');
    light(cur);
    const my = ++token;
    audio.src = C.segs[cur].audio;
    audio.playbackRate = parseFloat(rateSel.value);
    audio.onended = () => {
      if (my !== token || !playing) return;
      setTimeout(() => { if (playing && my === token) { cur++; cur < C.segs.length ? play() : finish(); } }, GAP * 1000 - 100);
    };
    audio.onerror = () => { if (my === token) { stop(); playBtn.textContent = '▶ Retry'; } };
    const p = audio.play(); if (p && p.catch) p.catch(() => {});
    if (cur + 1 < C.segs.length) { const warm = new Audio(); warm.preload = 'auto'; warm.src = C.segs[cur + 1].audio; }
    clearInterval(timer); timer = setInterval(tick, 200);
  }
  function stop() {
    playing = false; token++; audio.pause(); clearInterval(timer);
    playBtn.textContent = '▶ Play'; playBtn.setAttribute('aria-label', 'Play narration');
  }
  function finish() {
    stop(); cur = 0; scene.classList.remove('lit');
    paras.forEach(p => p.classList.remove('on', 'done')); fill.style.width = '100%';
    const fin = $('finished'); if (fin) fin.hidden = false;
    try { document.dispatchEvent(new CustomEvent('mp:cardfinished', { detail: { card: C.n } })); } catch (e) {}
  }
  function jump(i) { stop(); cur = Math.max(0, Math.min(i, C.segs.length - 1)); play(); }

  // build the script panel
  C.segs.forEach((s, k) => {
    const d = document.createElement('div'); d.className = 'p'; d.innerHTML = s.html; d.tabIndex = 0;
    d.setAttribute('role', 'button');
    d.addEventListener('click', () => jump(k));
    d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(k); } });
    script.appendChild(d); paras.push(d);
  });
  let acc = 0;
  C.segs.forEach(s => { acc += s.dur + GAP; const b = document.createElement('b'); b.style.left = (acc / total * 100) + '%'; bar.appendChild(b); });
  timeEl.textContent = '0:00 / ' + fmt(total);

  playBtn.onclick = () => playing ? stop() : play();
  $('restart').onclick = () => { stop(); cur = 0; play(); };
  bar.onclick = e => {
    const f = (e.clientX - bar.getBoundingClientRect().left) / bar.clientWidth * total;
    let i = 0; while (i < C.segs.length - 1 && before(i + 1) <= f) i++; jump(i);
  };
  rateSel.onchange = () => { audio.playbackRate = parseFloat(rateSel.value); try { localStorage.setItem('mp_rate', rateSel.value); } catch (e) {} };
  try { const r = localStorage.getItem('mp_rate'); if (r && [...rateSel.options].some(o => o.value === r)) rateSel.value = r; } catch (e) {}

  const focusBtn = $('focus');
  function setFocus(on) {
    document.body.classList.toggle('focus', on);
    focusBtn.textContent = on ? 'Show script' : 'Focus mode';
    try { localStorage.setItem('mp_focus', on ? '1' : '0'); } catch (e) {}
  }
  focusBtn.onclick = () => setFocus(!document.body.classList.contains('focus'));
  (function () { let on = new URLSearchParams(location.search).get('focus') === '1';
    try { if (localStorage.getItem('mp_focus') === '1') on = true; } catch (e) {} if (on) setFocus(true); })();

  document.addEventListener('keydown', e => {
    const t = e.target.tagName; if (t === 'SELECT' || t === 'INPUT' || t === 'TEXTAREA' || t === 'BUTTON') return;
    if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); }
    else if (e.key === 'ArrowRight') { jump(cur + 1); }
    else if (e.key === 'ArrowLeft') { jump(cur - 1); }
    else if (e.key === ']' && C.next) { location.href = C.next; }
    else if (e.key === '[' && C.prev) { location.href = C.prev; }
  });
})();
