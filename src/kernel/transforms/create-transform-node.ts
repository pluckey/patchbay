import { nanoid } from "nanoid"
import type { Position, TransformNodeData } from "../entities"

export function createTransformNode(
  position: Position,
  transformCode: string = "return input.text"
): TransformNodeData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "transform",
    transformCode,
    position,
    dimensions: { width: 280, height: 200 },
    createdAt: now,
    updatedAt: now,
  }
}
