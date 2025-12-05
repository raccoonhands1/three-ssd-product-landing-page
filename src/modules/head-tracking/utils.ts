import type { FaceTrackingEvent, HeadOffset } from './types'

export function applySoftLimit(value: number, limit: number): number {
  const absValue = Math.abs(value)
  const sign = Math.sign(value)

  const k = 3.0
  const normalized = absValue / limit
  const limited = limit * (1 - Math.exp(-k * normalized))

  return sign * limited
}

export function calculateOffset(
  faceEvent: FaceTrackingEvent,
  canvasCenterX: number,
  canvasCenterY: number,
  faceTrackingScale: { x: number; y: number },
  cameraLimits: { x: number; y: number },
): HeadOffset {
  const offsetX = ((faceEvent.x - canvasCenterX) * faceTrackingScale.x) / 100
  const offsetY = ((faceEvent.y - canvasCenterY) * faceTrackingScale.y) / 100

  const limitedX = applySoftLimit(offsetX, cameraLimits.x)
  const limitedY = applySoftLimit(-offsetY, cameraLimits.y)

  return {
    x: limitedX,
    y: limitedY,
    z: 0,
  }
}
