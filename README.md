# NRCME Memory Palace — website

Static site (no build step on the host). Deploy the whole folder as-is: Netlify publishes `.`
(see `netlify.toml`), or drag the folder onto Netlify Drop.

Structure
- `index.html` — landing page
- `cards/` — overview + one page per card (`cards/00/` … `cards/13/`): narrated spotlight player + 9–10 questions
- `cheatsheet/` — 10 web sections with stable heading anchors + `NRCME-Memory-Palace-Cheat-Sheet.pdf`
- `practice/` — full question bank (study by card, or a random 20-question quiz)
- `signin/` — placeholder for member accounts
- `assets/` — CSS, player.js, quiz.js, card images (`img/`), narration audio (`audio/cardNN/segNN.mp3`)
- `data/questions.json`, `data/cards.json` — the content the pages read

The generator lives in the DOT workshop (`workshop/web/`): `prepare_cheatsheet.py` → `build_questions.py` → `build.py`
rebuild this folder from the narrations, audio, renders and cheat-sheet sections.
