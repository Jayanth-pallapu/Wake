import { json } from "@/lib/api";

/** Client uses this to confirm the chat service gateway port before opening socket. */
export async function GET() {
  return json({
    port: 3003,
    transportQuery: { XTransformPort: "3003" },
    path: "/",
  });
}
