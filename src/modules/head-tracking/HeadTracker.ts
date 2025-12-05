import type { FaceTrackingEvent, HeadOffset, HeadTrackingConfig } from './types'
import { DEFAULT_CONFIG } from './config'
import { calculateOffset } from './utils'

export class HeadTracker {
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private tracker: any = null
  private targetOffset: HeadOffset = { x: 0, y: 0, z: 0 }
  private currentOffset: HeadOffset = { x: 0, y: 0, z: 0 }
  private config: Required<HeadTrackingConfig>
  private onOffsetUpdate?: (offset: HeadOffset) => void
  private faceTrackingListener: ((event: Event) => void) | null = null
  private videoId: string
  private canvasId: string

  constructor(
    videoId: string,
    canvasId: string,
    config: HeadTrackingConfig = {},
    onOffsetUpdate?: (offset: HeadOffset) => void,
  ) {
    this.videoId = videoId
    this.canvasId = canvasId
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.onOffsetUpdate = onOffsetUpdate
  }

  async init(): Promise<void> {
    this.videoElement = document.getElementById(this.videoId) as HTMLVideoElement
    this.canvasElement = document.getElementById(this.canvasId) as HTMLCanvasElement

    if (!this.videoElement || !this.canvasElement) {
      throw new Error(
        `Could not find video element (#${this.videoId}) or canvas element (#${this.canvasId})`,
      )
    }

    if (!window.headtrackr) {
      throw new Error('headtrackr library not loaded')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      this.videoElement.srcObject = stream
      await this.videoElement.play()

      this.tracker = new window.headtrackr.Tracker(this.config.headtrackrOptions)
      this.tracker.init(this.videoElement, this.canvasElement, false)

      this.faceTrackingListener = (event: Event) => {
        const faceEvent = event as FaceTrackingEvent

        if (faceEvent.detection === 'CS') {
          this.targetOffset = calculateOffset(
            faceEvent,
            this.config.canvasCenterX,
            this.config.canvasCenterY,
            this.config.faceTrackingScale,
            this.config.cameraLimits,
          )
        }
      }

      document.addEventListener('facetrackingEvent', this.faceTrackingListener)
    } catch (error) {
      throw new Error(`Failed to initialize head tracker: ${error}`)
    }
  }

  start(): void {
    if (!this.tracker) {
      throw new Error('Head tracker not initialized. Call init() first.')
    }
    this.tracker.start()
  }

  stop(): void {
    if (this.tracker) {
      this.tracker.stop()
    }
  }

  update(): void {
    this.currentOffset.x +=
      (this.targetOffset.x - this.currentOffset.x) * this.config.cameraSmoothing
    this.currentOffset.y +=
      (this.targetOffset.y - this.currentOffset.y) * this.config.cameraSmoothing
    this.currentOffset.z +=
      (this.targetOffset.z - this.currentOffset.z) * this.config.cameraSmoothing

    if (this.onOffsetUpdate) {
      this.onOffsetUpdate({ ...this.currentOffset })
    }
  }

  getOffset(): HeadOffset {
    return { ...this.currentOffset }
  }

  destroy(): void {
    this.stop()

    if (this.faceTrackingListener) {
      document.removeEventListener('facetrackingEvent', this.faceTrackingListener)
      this.faceTrackingListener = null
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      this.videoElement.srcObject = null
    }

    this.tracker = null
    this.videoElement = null
    this.canvasElement = null
  }
}
