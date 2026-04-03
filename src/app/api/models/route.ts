import { MODEL_ROSTER } from "@/server/config/providers"

export async function GET() {
  return Response.json({ models: MODEL_ROSTER })
}
