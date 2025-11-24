# 📄 Tools Instructions

## Overview

This document explains the available tools, their purpose, and usage patterns. Use it as a quick reference when building workflows.

---

## 🎨 `graphic_art`

**Purpose:** Generate or edit images.

**Use when:** Creating new visuals or editing uploaded ones.

**Parameters:**

- `prompt`: description of desired image
- `progression_text`: short creative message (6–8 words, ends with ellipses)
- `transparent_background`: `true` or `false`

---

## 🔍 `search_web`

**Purpose:** Fetch fresh, authoritative information from the web.

**Use when:** Any query involving facts, explanations, comparisons, or advice.

**Parameters:**

- `query`: concise search string
- `answers`: optional (null if not needed)

---

## 💹 `search_finance`

**Purpose:** Get financial data (stocks, crypto, currency exchange, indices).

**Parameters:**

- `stockExchangePrefix`: optional market code
- `tickerSymbol`: asset symbol
- `intent`: stock, crypto, currencyExchange, index, ETF, fund
- `fromCurrency` / `toCurrency`: for conversions
- `currencyExchangeAmount`: numeric amount

---

## 🧠 `memory_durable_fact`

**Purpose:** Store facts the user wants remembered.

**Parameters:**

- `fact`: information to remember
- `category`: optional category (e.g., PreferredName)
- `category_value`: optional value

---

## 📂 `search_personal_data`

**Purpose:** Search user‑connected services (OneDrive, Gmail, Outlook, etc.).

**Artifacts:** `document`, `event`, `contact`, `mail`, `web_page`

**Parameters:**

- `query`: keywords
- `artifacts`: type of item
- `target_services`: specific service (optional)
- `start_at` / `end_at`: time bounds
- `new`: true/false for unseen data
- `label`: folder/label filter

---

## 📊 `execute_code_orchestration`

**Purpose:** Data visualization (charts, plots).

**Parameters:**

- `prompt`: full description of task + data
- `title`: concise summary (≤15 words)
- `is_document_creation_request`: true/false

---

## 🌐 `fetch_web_content`

**Purpose:** Fetch and extract content from a given URL.

**Parameters:**

- `url`: target webpage

---

## 🃏 `generate_flashcard`

**Purpose:** Create flashcards for studying.

**Default:** 15 cards per set (max 30).

---

## 📝 `generate_quiz`

**Purpose:** Create multiple‑choice quizzes.

**Default:** 5 questions (max 15).

**Format:** JSON array with `question`, `options`, `answer`, `explanation`.

---

## 🖼️ `search_images`

**Purpose:** Find relevant images.

**Parameters:**

- `query`: search string
- `page`: results page (default 0)

---

## 📍 `search_places`

**Purpose:** Find places (restaurants, landmarks, activities).

**Parameters:**

- `query`: location search string
- `is_near_me`: true/false

---

## 🛒 `search_products`

**Purpose:** Aggregate shopping results.

**Parameters:**

- `query`: product search string
- `category`, `city`, `country`: optional filters

---

## 🎥 `search_videos`

**Purpose:** Find videos (tutorials, clips, trailers).

**Parameters:**

- `query`: search string
- `page`: results page (default 0)

---

## ⚡ `multi_tool_use.parallel`

**Purpose:** Run multiple tools simultaneously.

**Parameters:**

- `tool_uses`: array of `{ recipient_name, parameters }`

---

## ✅ Best Practices Checklist

### General

- Keep queries **concise and specific** — avoid filler words.
- Always prefer **parallel tool calls** when multiple tools can run independently.
- Use environment variables (`.env.local`, `.env.staging`, `.env.production`) to separate dev/staging/prod contexts.

---

### 🔍 Web & Data Tools

- **Always use `search_web`** for factual queries, even if the info seems "common knowledge."
- Combine `search_web` + `search_images` or `search_videos` when visuals or clips enhance the answer.
- Use `search_finance` only for supported intents (stocks, crypto, currency exchange, indices, ETFs, funds).

---

### 🎨 Image Tools

- Use `graphic_art` only for **safe, clear image generation/editing**.
- Never attempt to generate restricted content (political figures, trademarked characters, unsafe scenarios).
- Confirm an image is actually uploaded before editing.

---

### 📂 Personal Data

- Use `search_personal_data` only for supported artifacts (documents, events, contacts, emails, web pages).
- Never attempt to summarize or analyze retrieved content — only list metadata.
- Respect service boundaries (OneDrive, Gmail, Outlook, etc.).

---

### 📊 Visualization

- Use `execute_code_orchestration` only for **data visualization** (charts, plots).
- Ensure the prompt is **self‑contained** with all required data.
- Ask for missing data before attempting visualization.

---

### 🃏 Study Tools

- Default to 15 flashcards (`generate_flashcard`) and 5 quiz questions (`generate_quiz`).
- Respect maximum limits (30 flashcards, 15 quiz questions).
- Ensure quizzes are multiple‑choice with one correct answer.

---

### ⚡ Parallel Execution

- Use `multi_tool_use.parallel` when multiple tools can run at the same time.
- Keep parameters valid and minimal — no extra words or punctuation.

---

### 🛠️ Workflow Hygiene

- Clear caches (`.next/`) if builds fail unexpectedly.
- Run `npm run lint` and `npx tsc --noEmit` to catch errors early.
- Keep `tailwind.config.js` and `next.config.js` aligned with project structure.

---

## 📖 Quick Examples

### 🔍 Web Search

```json
{
  "recipient_name": "search_web",
  "parameters": {
    "query": "latest AI conferences 2025",
    "answers": null
  }
}
```

---

### 🎨 Image Generation

```json
{
  "recipient_name": "graphic_art",
  "parameters": {
    "prompt": "modern dashboard UI with charts and tables",
    "progression_text": "Designing a sleek interface now...",
    "transparent_background": false
  }
}
```

---

### 💹 Finance Data

```json
{
  "recipient_name": "search_finance",
  "parameters": {
    "tickerSymbol": "MSFT",
    "stockExchangePrefix": "NASDAQ",
    "intent": "stock"
  }
}
```

---

### 📂 Personal Data Search

```json
{
  "recipient_name": "search_personal_data",
  "parameters": {
    "query": "project proposal",
    "artifacts": "document",
    "target_services": "one_drive",
    "start_at": "2025-11-01T00:00:00",
    "end_at": "2025-11-24T00:00:00",
    "new": false,
    "label": null
  }
}
```

---

### 📊 Visualization

```json
{
  "recipient_name": "execute_code_orchestration",
  "parameters": {
    "prompt": "Create a line chart showing monthly sales for 2025. Data: Jan 120, Feb 150, Mar 170",
    "title": "Line chart of monthly sales",
    "is_document_creation_request": false
  }
}
```

---

### 🌐 Fetch Web Content

```json
{
  "recipient_name": "fetch_web_content",
  "parameters": {
    "url": "https://example.com/article"
  }
}
```

---

### 🃏 Flashcards

```json
{
  "recipient_name": "generate_flashcard",
  "parameters": {}
}
```

---

### 📝 Quiz

```json
{
  "recipient_name": "generate_quiz",
  "parameters": {}
}
```

---

### 🖼️ Image Search

```json
{
  "recipient_name": "search_images",
  "parameters": {
    "query": "New York skyline",
    "page": 0
  }
}
```

---

### 📍 Places Search

```json
{
  "recipient_name": "search_places",
  "parameters": {
    "query": "thai restaurants in Jersey City",
    "is_near_me": false
  }
}
```

---

### 🛒 Product Search

```json
{
  "recipient_name": "search_products",
  "parameters": {
    "query": "wireless earbuds under $100",
    "category": null,
    "city": null,
    "country": null
  }
}
```

---

### 🎥 Video Search

```json
{
  "recipient_name": "search_videos",
  "parameters": {
    "query": "Next.js tutorial",
    "page": 0
  }
}
```

---

### ⚡ Parallel Tool Use

```json
{
  "recipient_name": "multi_tool_use.parallel",
  "parameters": {
    "tool_uses": [
      {
        "recipient_name": "search_web",
        "parameters": { "query": "Tesla stock", "answers": null }
      },
      {
        "recipient_name": "search_finance",
        "parameters": { "tickerSymbol": "TSLA", "intent": "stock" }
      }
    ]
  }
}
```

---

## 🔗 Related Documentation

- [CI/CD Setup Summary](./CI_CD_SETUP_SUMMARY.md) - Deployment pipeline guide
- [Branching Strategy](./BRANCHING_STRATEGY.md) - Git workflow conventions
- [API Reference](./API_REFERENCE.md) - Backend API documentation

---

**Last Updated:** November 24, 2025  
**Maintained By:** DevOps Team
