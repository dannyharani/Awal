# Contributing to Awal (ⴰⵡⴰⵍ)

Thank you for your interest in contributing to **Awal**! Awal is an open-source, community-driven digital platform dedicated to the preservation, documentation, standardization, and education of the Amazigh language (Tamaziɣt) across all its dialects and scripts.

Whether you are a native speaker, linguist, educator, developer, or enthusiast, your contribution is deeply valued.

---

## Table of Contents
1. [Ways to Contribute](#ways-to-contribute)
2. [Contributing to Internationalization (i18n)](#contributing-to-internationalization-i18n)
   - [Supported Locales](#supported-locales)
   - [File Structure](#file-structure)
   - [How to Improve Existing Translations](#how-to-improve-existing-translations)
   - [How to Add a New Dialect or Language](#how-to-add-a-new-dialect-or-language)
   - [Amazigh Orthography & Linguistic Guidelines](#amazigh-orthography--linguistic-guidelines)
3. [Contributing Code](#contributing-code)
   - [Development Setup](#development-setup)
   - [Running Checks & Tests](#running-checks--tests)
4. [Pull Request Workflow](#pull-request-workflow)
5. [Code of Conduct & Community Values](#code-of-conduct--community-values)

---

## Ways to Contribute

You do not need to be a software developer to make a huge impact:
- **Linguistics & Translation**: Refine terminology, fix typos in Neo-Tifinagh or Latin scripts, or add full support for regional dialects (Tachelhit, Tarifit, Tumẓabt, Chaouia, etc.).
- **Lexicon & Audio**: Add headwords, phonetic definitions, example sentences, and record native audio pronunciations directly on the live platform.
- **Educational Curriculum**: Design interactive courses, grammar decks, and vocabulary quizzes in the Educator Studio.
- **Code & Game Design**: Help build the upcoming daily games (*Tawalt*, *Anagam*, *Assaɣen*, *Agemmay Mini*), optimize search indexing, or improve accessibility.

---

## Contributing to Internationalization (i18n)

Awal uses [Paraglide-JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (powered by Inlang) to deliver type-safe, compile-time internationalization without client bloat.

### Supported Locales

| Locale Code | Language / Dialect | Script | Status |
| :--- | :--- | :--- | :--- |
| `en` | English | Latin | Base Locale (Complete) |
| `fr` | Français (French) | Latin | Complete |
| `es` | Español (Spanish) | Latin | Complete |
| `ar` | العربية (Arabic) | Arabic | Complete (RTL enabled) |
| `kab` | Taqbaylit (Kabyle) | Tamaziɣt Latin | Complete |
| `zgh` | Tamaziɣt Tanawayt (Standard Moroccan) | Neo-Tifinagh (IRCAM) | Complete |

### File Structure

All translation catalogs live in the root `messages/` folder:
```
messages/
├── en.json    # Base English catalog
├── fr.json    # French
├── es.json    # Spanish
├── ar.json    # Arabic
├── kab.json   # Kabyle (Latin)
└── zgh.json   # Standard Moroccan Amazigh (Tifinagh)
```

Inlang settings are managed in:
```
project.inlang/
└── settings.json
```

### How to Improve Existing Translations

1. **Fork & Clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/awal.git
   cd awal
   pnpm install
   ```
2. Open the file corresponding to the language you want to update (e.g., `messages/zgh.json` or `messages/kab.json`).
3. Edit the target message key:
   ```json
   "nav_studio": "ⴰⵙⴰⵔⴰⴳ ⵏ ⵓⵙⵍⵎⴷ"
   ```
4. Compile the Paraglide runtime:
   ```bash
   pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide
   ```
5. Verify the build passes cleanly:
   ```bash
   pnpm check
   pnpm test
   ```
6. Submit a Pull Request!

### How to Add a New Dialect or Language

To add a new language (for example, Tachelhit `shi` or Tarifit `rif`):
1. Add the locale code to `project.inlang/settings.json`:
   ```json
   "locales": ["en", "es", "fr", "kab", "zgh", "ar", "shi"]
   ```
2. Create `messages/shi.json` following the keys present in `messages/en.json`.
3. Recompile Paraglide:
   ```bash
   pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide
   ```
4. Add the language metadata (label, native script, flag) to [`src/lib/components/navigation/LanguageSwitcher.svelte`](file:///src/lib/components/navigation/LanguageSwitcher.svelte).

### Amazigh Orthography & Linguistic Guidelines

When translating into Tamaziɣt:
- **Neo-Tifinagh (IRCAM standard)**: Use standardized Unicode characters in range `U+2D30` to `U+2D7F`. Avoid mixing Latin words into Tifinagh strings.
- **Tamaziɣt Latin**: Follow the standardized Berber Latin alphabet:
  - Consonants: `č`, `ḍ`, `ǧ`, `ɣ`, `ḥ`, `ɛ`, `q`, `ř`, `ṛ`, `ṣ`, `ṭ`, `ẓ`.
  - Labiovelarization: `bʷ`, `gʷ`, `kʷ`, `mʷ`, `xʷ`, `ɣʷ`.
- **Loanwords**: Favor authentic Amazigh roots (*amawal amzwaru*) over recent European or colloquial borrowings whenever standard neologisms exist (e.g., use **Asarag** for studio/workshop, **Tamsirt** for lesson, **Awal** for word).

---

## Contributing Code

### Development Setup

1. **Prerequisites**:
   - [Node.js](https://nodejs.org/) (v20+ recommended)
   - [pnpm](https://pnpm.io/) (v9+)
   - A [Supabase](https://supabase.com/) account or local Docker CLI for database emulation.

2. **Clone & Install**:
   ```bash
   git clone https://github.com/<your-username>/awal.git
   cd awal
   pnpm install
   ```

3. **Environment Configuration**:
   Create a `.env` file based on `.env.example`:
   ```env
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Start the Development Server**:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:5173` in your browser.

### Running Checks & Tests

Before submitting any code changes, ensure all automated verification suites pass:
```bash
# Type check Svelte and TypeScript
pnpm check

# Run Vitest unit tests
pnpm test

# Build production bundle
pnpm build
```

---

## Pull Request Workflow

1. Create a feature or translation branch:
   ```bash
   git checkout -b i18n/kabyle-dictionary-refinements
   ```
2. Keep commits concise and meaningful:
   ```bash
   git commit -m "i18n(kab): improve course catalog and dictionary labels"
   ```
3. Push to your fork:
   ```bash
   git push origin i18n/kabyle-dictionary-refinements
   ```
4. Open a Pull Request against the `main` branch. Fill out the provided PR template.

---

## Community Values

- **Linguistic Inclusivity**: All Amazigh varieties (Northern, Atlas, Saharan, Tuareg, Canary/Guanche heritage) are treated with equal respect and dignity.
- **Constructive Collaboration**: Offer kind, constructive feedback. Assume good faith.
- **Open Knowledge**: All contributions to Awal are made available under open-source and open-data licensing for the perpetual benefit of the Amazigh people and world heritage.
