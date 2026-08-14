// Server-side helper to push real events into the chat Socket.io mini-service.
// Server-to-server call — NOT subject to browser gateway rules.
// CHAT_SERVICE_URL: set to the production URL of your chat service in env vars.

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL ?? "http://localhost:3003";


export async function pushChatNotify(
  event: "tip" | "win" | "mega" | "rain" | "system",
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(`${CHAT_SERVICE_URL}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload }),
      // don't hang the request forever
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    // Best-effort: chat service may be down. Don't fail the parent operation.
    console.warn("[chat-push] notify failed:", e instanceof Error ? e.message : e);
  }
}
