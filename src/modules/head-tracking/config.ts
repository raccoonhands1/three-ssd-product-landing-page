import type { HeadTrackingConfig } from './types'

export const DEFAULT_CONFIG: Required<HeadTrackingConfig> = {
  faceTrackingScale: { x: 3, y: 2 },
  cameraSmoothing: 0.05,
  canvasCenterX: 160,
  canvasCenterY: 120,
  cameraLimits: { x: 2.0, y: 1.5 },
  headtrackrOptions: {
    ui: false,
    smoothing: true,
    retryDetection: true,
    detectionInterval: 20,
    fadeVideo: false,
    calcAngles: true,
    headPosition: false,
  },
}
