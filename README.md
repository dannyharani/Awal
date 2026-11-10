# Aselkim (ⴰⵙⵍⴽⵉⵎ) ⵣ

> **The Open-Source Digital Platform for the Amazigh Language & Heritage**  
> *Crowdsourced Dictionary • Educator Academy • Daily Word Games • Pan-Dialect Inclusivity*

[![CI](https://github.com/danniharany/aselkim/actions/workflows/ci.yml/badge.svg)](https://github.com/danniharany/aselkim/actions/workflows/ci.yml)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-orange.svg)](https://kit.svelte.dev)
[![Svelte 5](https://img.shields.io/badge/Svelte-5.x%20Runes-red.svg)](https://svelte.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com)
[![Paraglide i18n](https://img.shields.io/badge/i18n-Paraglide--JS-blue.svg)](https://inlang.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Vision & Etymology

**Aselkim** (ⴰⵙⵍⴽⵉⵎ) is the Tamaziɣt word for *computer / processor*, derived from the ancient root **S-L-K-M** (to convey, connect, transmit, deliver).

Aselkim serves as an all-in-one digital sanctuary where speakers, learners, educators, and linguists can:
1. **Document and standardize** Amazigh vocabulary across all regional variants (*Tantaliwin*).
2. **Teach and learn** through interactive, multimedia courses designed by native educators.
3. **Build daily engagement** through NYT-style Amazigh daily brain games (*Uraren*).
4. **Unify dialects and scripts** by treating Neo-Tifinagh, Tamaziɣt Latin, and Arabic scripts with equal first-class status.

---

## 🏛 Four Pillars of Aselkim

```
                   ┌─────────────────────────────────┐
                   │        ASELKIM PLATFORM         │
                   └────────────────┬────────────────┘
          ┌──────────────────┬──────┴───────────┬──────────────────┐
          ▼                  ▼                  ▼                  ▼
┌──────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│     ⴰⵎⴰⵡⴰⵍ       │ │    ⵜⵉⵎⵙⵉⵔⵉⵏ    │ │     ⵓⵔⴰⵔⵏ      │ │     ⴰⵎⵣⴷⴰⵢ     │
│     Amawal       │ │    Timsirin    │ │     Uraren     │ │    Amezday     │
│ (Open Dictionary)│ │(Academy/Studio)│ │ (Daily Games)  │ │  (Community)   │
└──────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

1. **Amawal (ⴰⵎⴰⵡⴰⵍ - Crowdsourced Dictionary)**:
   - Multi-script search indexing: instant matching across Latin (`Aɣrum`), Neo-Tifinagh (`ⴰⵖⵔⵓⵎ`), Arabic (`أغروم`), and translations.
   - Community voting on definitions, phonetic notes, grammar tags (root, gender, state, part of speech).
   - Audio pronunciation recording and playback for real spoken dialect authenticity.
   - Cross-dialect semantic mapping (variants, synonyms, antonyms, derived forms).
   - Discussion threads for dialect nuances and etymology debates.

2. **Timsirin (ⵜⵉⵎⵙⵉⵔⵉⵏ - Courses & Educator Studio)**:
   - Visual drag-and-drop curriculum builder with inline renaming for modules and lessons.
   - Interactive multi-step lesson player (Theory/Markdown, Video, Vocabulary Flashcards, and Quizzes).
   - Categorized by subject: Daily Conversation (*Asiwel*), Grammar (*Tajerrumt*), Vocabulary (*Amawal*), Alphabet (*Agemmay*), and Culture (*Tasekla*).
   - Topic tag taxonomy (`#tifinagh`, `#greetings`, `#verbs`).
   - Personal learner progress tracking with enrollment filters.

3. **Uraren (ⵓⵔⴰⵔⵏ - Daily Amazigh Games)**:
   - **Tawalt (ⵜⴰⵡⴰⵍⵜ)**: Amazigh Wordle in Latin & Tifinagh scripts.
   - **Anagam (ⴰⵏⴰⴳⴰⵎ)**: 7-letter Spelling Bee / Word Wheel with central root consonants.
   - **Assaɣen (ⴰⵙⵙⴰⵖⵏ)**: Connections / 4-group thematic cluster game.
   - **Agemmay Mini (ⴰⴳⵎⵎⴰⵢ)**: 5×5 daily cultural crossword.

4. **Amezday (ⴰⵎⵣⴷⴰⵢ - Community & i18n)**:
   - Fully localized in 6 languages: English, Français, Español, العربية, Taqbaylit (Kabyle), and Tamaziɣt Tanawayt (Tifinagh).
   - Open-source contribution workflow empowering speakers from Morocco, Algeria, Tunisia, Libya, Mali, Niger, and the worldwide diaspora.

---

## 🌐 Internationalization (i18n)

Aselkim is built from the ground up for multilingual communities:

| Code | Language / Dialect | Script | Direction |
| :--- | :--- | :--- | :--- |
| `en` | English | Latin | LTR |
| `fr` | Français | Latin | LTR |
| `es` | Español | Latin | LTR |
| `ar` | العربية | Arabic | RTL |
| `kab`| Taqbaylit (Kabyle) | Latin (Berber standard) | LTR |
| `zgh`| Tamaziɣt Tanawayt (Standard Moroccan) | Neo-Tifinagh (IRCAM) | LTR |

We warmly invite contributions for additional varieties (Tachelhit `shi`, Tarifit `rif`, Tumẓabt `mzb`, Chaouia `chx`, Tuareg `thz`, etc.). See [CONTRIBUTING.md](CONTRIBUTING.md) for a step-by-step translation guide!

---

## 🛠 Tech Stack

- **Framework**: [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5 Runes](https://svelte.dev/docs/svelte/v5-migration-guide)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Row-Level Security, RPC Full-Text Search)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [shadcn-svelte](https://next.shadcn-svelte.com/)
- **i18n Engine**: [Paraglide-JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- **Forms & Validation**: Superforms & [Zod 4](https://zod.dev)
- **Icons**: Lucide Icons
- **Testing**: Vitest, svelte-check, TypeScript

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- pnpm 9+
- A Supabase project (or local Supabase CLI)

### 2. Clone & Install
```bash
git clone https://github.com/<your-username>/aselkim.git
cd aselkim
pnpm install
```

### 3. Environment Variables
Create `.env` in the root directory:
```env
PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 4. Database Migrations
Migrations are stored in `supabase/migrations/`:
```bash
pnpm exec supabase db push --remote
```

### 5. Run Local Development Server
```bash
pnpm dev
```
Visit `http://localhost:5173` in your browser.

### 6. Verify & Test
```bash
# Compile Paraglide translation catalogs
pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide

# Type check
pnpm check

# Unit tests
pnpm test

# Production build
pnpm build
```

---

## 🤝 Contributing

We welcome all contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style, linguistic conventions, and how to submit pull requests.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Texts and crowdsourced lexicographical data are published under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
