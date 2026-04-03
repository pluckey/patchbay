import { nanoid } from "nanoid"
import type { Position, TransformNodeData } from "../entities"

export function createTransformNode(
  position: Position,
  transformCode: string = "// Access inputs by connection label:\n// return input.my_label.text\nreturn JSON.stringify(Object.keys(input))"
): TransformNodeData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "transform",
    transformCode,
    timeoutMs: 5000,
    position,
    dimensions: { width: 280, height: 200 },
    createdAt: now,
    updatedAt: now,
  }
}
