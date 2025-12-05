export interface FaceTrackingEvent extends Event {
  x: number
  y: number
  width: number
  height: number
  angle: number
  detection: string
}

export interface HeadTrackingStatusEvent extends Event {
  status: string
}

export interface HeadOffset {
  x: number
  y: number
  z: number
}

export interface HeadTrackingConfig {
  faceTrackingScale?: { x: number; y: number }
  cameraSmoothing?: number
  canvasCenterX?: number
  canvasCenterY?: number
  cameraLimits?: { x: number; y: number }
  headtrackrOptions?: {
    ui?: boolean
    smoothing?: boolean
    retryDetection?: boolean
    detectionInterval?: number
    fadeVideo?: boolean
    calcAngles?: boolean
    headPosition?: boolean
  }
}

declare global {
  interface Window {
    headtrackr: any
  }
}
