/**
 * Sends a notification to the configured security webhook URL
 * @param message The message to send
 * @param level Optional security level (green, orange, red)
 */
export async function sendWebhook(
  message: string,
  level?: "green" | "orange" | "red"
) {
  const url = process.env.SECURITY_WEBHOOK_URL;
  if (!url) return; // Skip if webhook URL not configured

  try {
    // Use native fetch available in Node.js 18+
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        level,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`Webhook request failed with status ${response.status}`);
    }
  } catch (err) {
    console.error("Security webhook notification failed:", err);
  }
}
