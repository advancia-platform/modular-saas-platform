# Advancia AI Chat Widget

This component provides a small, client-side chat widget for asking questions about the Advancia app.

Files added:

- `src/components/AdvanciaAIWidget.tsx` — client React component UI
- `src/app/api/ai/chat/route.ts` — app-route that returns a mock reply (swap for real AI proxy in production)

## How it works

- The widget POSTs to `/api/ai/chat` with `{ prompt }`.
- The route currently returns a canned reply for local/testing.
- To enable real AI responses, implement an OpenAI or other LLM proxy in `route.ts` and set the appropriate API key in production env vars.

## Quick notes

- The widget is added to the global `layout.tsx`. Remove or move it if you prefer page-level rendering.
- Styling is inline and intentionally minimal — feel free to replace with Tailwind classes or a separate CSS module.
