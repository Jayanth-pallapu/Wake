import { json } from "@/lib/api";

/** Stub: rain lifecycle is driven by the chat service (socket). This just confirms availability. */
export async function GET() {
  return json({
    active: true,
    message: "Rain events are broadcast via the live chat socket. Listen for 'rain:start'.",
    cooldownSeconds: 60,
  });
}
