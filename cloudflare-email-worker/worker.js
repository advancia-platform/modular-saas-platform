/**
 * CloudFlare Email Worker
 * Handles incoming emails to support@advanciapayledger.com
 * Forwards to Gmail and optionally creates support tickets
 */

export default {
  async email(message, env, ctx) {
    // Forward to your Gmail
    const forwardTo = "advanciapayledger@gmail.com";
    
    try {
      // Extract email details
      const from = message.from;
      const to = message.to;
      const subject = message.headers.get("subject") || "No Subject";
      
      console.log(`Received email from: ${from} to: ${to}`);
      console.log(`Subject: ${subject}`);
      
      // Forward the email
      await message.forward(forwardTo);
      
      // Optional: Send to backend API to create support ticket
      if (env.BACKEND_API_URL) {
        try {
          const emailContent = await streamToString(message.raw);
          
          await fetch(`${env.BACKEND_API_URL}/api/support/email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": env.API_SECRET_KEY || "internal"
            },
            body: JSON.stringify({
              from: from,
              to: to,
              subject: subject,
              timestamp: new Date().toISOString(),
              rawEmail: emailContent
            })
          });
          
          console.log("Support ticket created in backend");
        } catch (apiError) {
          console.error("Failed to create support ticket:", apiError);
          // Continue - email still forwarded even if API fails
        }
      }
      
      console.log(`Email forwarded to: ${forwardTo}`);
      
    } catch (error) {
      console.error("Email processing error:", error);
      // Reject the email with a friendly message
      message.setReject(`Failed to process email: ${error.message}`);
    }
  }
};

// Helper function to convert stream to string
async function streamToString(stream) {
  const chunks = [];
  const reader = stream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let position = 0;
  for (const chunk of chunks) {
    combined.set(chunk, position);
    position += chunk.length;
  }
  
  return new TextDecoder().decode(combined);
}
