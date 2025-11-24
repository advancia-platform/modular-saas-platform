# 🛠️ Tools Quick Reference

## 🔍 Information & Search

-   **search_web** → Always use for facts, explanations, comparisons, advice.
-   **search_images** → Find visuals (animals, places, logos, styles).
-   **search_videos** → Find clips, tutorials, trailers.
-   **search_places** → Restaurants, landmarks, activities (supports `is_near_me`).
-   **search_products** → Shopping results (title, price, reviews, seller).
-   **search_finance** → Stocks, crypto, currency exchange, indices, ETFs, funds.

---

## 🎨 Creative & Visualization

-   **graphic_art** → Generate or edit safe images.
-   **execute_code_orchestration** → Data visualization (charts, plots).
-   **generate_flashcard** → Study flashcards (default 15, max 30).
-   **generate_quiz** → Multiple‑choice quizzes (default 5, max 15).

---

## 📂 Personal & Memory

-   **search_personal_data** → Search connected services (docs, events, contacts, emails, web history).
-   **memory_durable_fact** → Store facts (e.g., preferred name, preferences).

---

## 🌐 Web Content

-   **fetch_web_content** → Extract content from a given URL.
-   **multi_tool_use.parallel** → Run multiple tools simultaneously.

---

## ✅ Best Practices

### General

-   Keep queries **concise and specific**.
-   Prefer **parallel calls** when multiple tools can run independently.
-   Separate environments with `.env.local`, `.env.staging`, `.env.production`.

### Search

-   Always ground facts with `search_web`.
-   Combine with `search_images` or `search_videos` for richer answers.
-   Use `search_finance` only for supported intents.

### Creative

-   Use `graphic_art` only for safe, clear image generation/editing.
-   Confirm an image is uploaded before editing.
-   Provide complete data for `execute_code_orchestration`.

### Personal Data

-   Only supported artifacts: docs, events, contacts, emails, web pages.
-   Never summarize or analyze retrieved content — list metadata only.

### Study Tools

-   Respect limits: 30 flashcards, 15 quiz questions.
-   Ensure quizzes are multiple‑choice with one correct answer.

---

## ⚡ Quick Examples

-   **Web search:** `{ "query": "latest AI conferences 2025" }`
-   **Image gen:** `{ "prompt": "modern dashboard UI", "transparent_background": false }`
-   **Finance:** `{ "tickerSymbol": "MSFT", "intent": "stock" }`
-   **Personal data:** `{ "query": "project proposal", "artifacts": "document" }`
-   **Visualization:** `"prompt": "Line chart of monthly sales 2025"`
-   **Parallel:** `[ search_web: "Tesla stock", search_finance: "TSLA" ]`

---

## 🛠️ Workflow Hygiene

-   Clear caches (`.next/`) if builds fail unexpectedly.
-   Run `npm run lint` and `npx tsc --noEmit` to catch errors early.
-   Keep `tailwind.config.js` and `next.config.js` aligned with project structure.

---

## 🔗 Related Documentation

-   [Tools Instructions (Full)](./toolsinstructions.md) - Complete tool documentation with detailed examples
-   [CI/CD Setup Summary](./CI_CD_SETUP_SUMMARY.md) - Deployment pipeline guide
-   [Branching Strategy](./BRANCHING_STRATEGY.md) - Git workflow conventions
-   [API Reference](./API_REFERENCE.md) - Backend API documentation

---

**Last Updated:** November 24, 2025  
**Maintained By:** DevOps Team

---

**Print this page and pin it to your desk for quick tool access!** 📌
