<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three'
import studio from '@theatre/studio'
import { threeSetup, setupLights, loadAllModels } from './three-setup'
import { mainSheet } from './theater-config'

// TypeScript declarations for headtrackr
interface FacetrackingEvent extends Event {
  x: number // x position on canvas
  y: number // y position on canvas
  width: number
  height: number
  angle: number
  detection: string
}

interface HeadtrackrStatusEvent extends Event {
  status: string
}

declare global {
  interface Window {
    headtrackr: any
  }
}

// Face tracking configuration
const FACE_TRACKING_SCALE = {
  x: 3, // Multiplier for horizontal movement
  y: 2, // Multiplier for vertical movement
}

const CAMERA_SMOOTHING = 0.05

// Canvas center (320x240 from headtrackr)
const CANVAS_CENTER_X = 160
const CANVAS_CENTER_Y = 120

// Soft limits for camera movement
const CAMERA_LIMITS = {
  x: 2.0, // Max horizontal movement
  y: 1.5, // Max vertical movement
}

// Soft limit function with strong exponential falloff
function applySoftLimit(value: number, limit: number): number {
  const absValue = Math.abs(value)
  const sign = Math.sign(value)

  // Use exponential decay for smooth falloff
  // Formula: limit * (1 - e^(-k * x/limit))
  // This creates asymptotic approach to limit
  const k = 3.0 // Strength of falloff (higher = stronger resistance)
  const normalized = absValue / limit
  const limited = limit * (1 - Math.exp(-k * normalized))

  return sign * limited
}

// Head tracking state
const targetHeadOffset = { x: 0, y: 0, z: 0 }
const currentHeadOffset = { x: 0, y: 0, z: 0 }
let theaterCameraPosition = { x: 0, y: 0, z: 5 }
let theaterCameraLookAt = { x: 0, y: 0, z: 0 }

onMounted(async () => {
  if (import.meta.env.DEV) {
    studio.initialize()
  }

  const { scene, camera, renderer, composer, theaterObjects } = threeSetup()
  const lights = setupLights(scene)
  const bagPhysics = await loadAllModels(scene)

  const container = document.getElementById('viewport')
  if (!container) return

  renderer.setSize(container.clientWidth, container.clientHeight)
  composer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()

  const mouse = new THREE.Vector2()
  let isDragging = false
  let previousMouse = new THREE.Vector2()

  container.addEventListener('mousedown', (event) => {
    isDragging = true
    const rect = container.getBoundingClientRect()
    previousMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    previousMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  })

  container.addEventListener('mousemove', (event) => {
    if (!isDragging) return

    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const deltaX = mouse.x - previousMouse.x

    const rotationSpeed = 2.0
    const up = new THREE.Vector3(0, 1, 0)
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(up, deltaX * rotationSpeed)

    if (bagPhysics.bagBone) {
      bagPhysics.bagBone.quaternion.multiplyQuaternions(rotationQuat, bagPhysics.bagBone.quaternion)
    }

    if (bagPhysics.outlineBone) {
      bagPhysics.outlineBone.quaternion.multiplyQuaternions(
        rotationQuat,
        bagPhysics.outlineBone.quaternion,
      )
    }

    previousMouse.copy(mouse)
  })

  container.addEventListener('mouseleave', () => {
    isDragging = false
  })

  container.addEventListener('mouseup', () => {
    isDragging = false
  })

  theaterObjects.cameraObj.onValuesChange((values) => {
    // Only store the base position from Theatre.js
    // Actual camera update happens in animation loop
    theaterCameraPosition = { ...values.position }
    theaterCameraLookAt = { ...values.lookAt }
  })

  theaterObjects.modelObj.onValuesChange((values) => {
    if (bagPhysics.punchingBag) {
      bagPhysics.punchingBag.rotation.set(values.rotation.x, values.rotation.y, values.rotation.z)
      bagPhysics.punchingBag.position.set(values.position.x, values.position.y, values.position.z)
    }
    if (bagPhysics.wireframeModel) {
      bagPhysics.wireframeModel.rotation.set(
        values.rotation.x,
        values.rotation.y,
        values.rotation.z,
      )
      bagPhysics.wireframeModel.position.set(
        values.position.x,
        values.position.y,
        values.position.z,
      )
    }
  })

  theaterObjects.lightsObj.onValuesChange((values) => {
    lights.keyLight.intensity = values.keyLight.intensity
    lights.keyLight.position.set(
      values.keyLight.position.x,
      values.keyLight.position.y,
      values.keyLight.position.z,
    )

    lights.fillLight.intensity = values.fillLight.intensity
    lights.fillLight.position.set(
      values.fillLight.position.x,
      values.fillLight.position.y,
      values.fillLight.position.z,
    )

    lights.rimLight.intensity = values.rimLight.intensity
    lights.rimLight.position.set(
      values.rimLight.position.x,
      values.rimLight.position.y,
      values.rimLight.position.z,
    )

    lights.topLight.intensity = values.topLight.intensity
    lights.topLight.position.set(
      values.topLight.position.x,
      values.topLight.position.y,
      values.topLight.position.z,
    )
  })

  // Initialize head tracking
  const videoElement = document.getElementById('headtracker-video') as HTMLVideoElement
  const canvasElement = document.getElementById('headtracker-canvas') as HTMLCanvasElement

  if (videoElement && canvasElement && window.headtrackr) {
    try {
      // Set up video stream manually with modern API
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoElement.srcObject = stream
          videoElement.play()

          // Initialize headtrackr with video already set up
          const htracker = new window.headtrackr.Tracker({
            ui: false,
            smoothing: true,
            retryDetection: true,
            detectionInterval: 20,
            fadeVideo: false,
            calcAngles: true, // Enable angle calculation for face tracking
            headPosition: false, // Use face tracking instead of head position
          })

          // Pass false to setupVideo since we already set up the stream
          htracker.init(videoElement, canvasElement, false)
          htracker.start()

          console.log('Head tracking initialized')
        })
        .catch((error) => {
          console.warn('Camera access denied or unavailable:', error)
        })
    } catch (error) {
      console.warn('Head tracking failed to initialize:', error)
    }
  }

  // Listen for face tracking events (similar to the reference implementation)
  document.addEventListener('facetrackingEvent', (event) => {
    const faceEvent = event as FacetrackingEvent

    // Only process when we have stable tracking (CS = Camshift tracking)
    if (faceEvent.detection === 'CS') {
      // Debug: log events occasionally
      if (Math.random() < 0.02) {
        console.log('Face position:', { x: faceEvent.x, y: faceEvent.y })
      }

      // Calculate offset from canvas center (like the reference implementation)
      // Face at center (160, 120) = no offset
      // Face moves right (x > 160) = camera pans left (negative)
      // Face moves left (x < 160) = camera pans right (positive)
      const offsetX = ((faceEvent.x - CANVAS_CENTER_X) * FACE_TRACKING_SCALE.x) / 100
      const offsetY = ((faceEvent.y - CANVAS_CENTER_Y) * FACE_TRACKING_SCALE.y) / 100

      // Apply soft limits with gradual falloff
      const limitedX = applySoftLimit(-offsetX, CAMERA_LIMITS.x)
      const limitedY = applySoftLimit(-offsetY, CAMERA_LIMITS.y)

      targetHeadOffset.x = limitedX // Inverted with soft limits
      targetHeadOffset.y = limitedY // Inverted with soft limits
      targetHeadOffset.z = 0 // No depth tracking with face tracking
    }
  })

  document.addEventListener('headtrackrStatus', (event) => {
    const statusEvent = event as HeadtrackrStatusEvent
    console.log('Headtrackr status:', statusEvent.status)
  })

  const tick = () => {
    // Smooth interpolation towards target head offset
    currentHeadOffset.x += (targetHeadOffset.x - currentHeadOffset.x) * CAMERA_SMOOTHING
    currentHeadOffset.y += (targetHeadOffset.y - currentHeadOffset.y) * CAMERA_SMOOTHING
    currentHeadOffset.z += (targetHeadOffset.z - currentHeadOffset.z) * CAMERA_SMOOTHING

    // Apply Theatre.js base position + head tracking offset
    camera.position.set(
      theaterCameraPosition.x + currentHeadOffset.x,
      theaterCameraPosition.y + currentHeadOffset.y,
      theaterCameraPosition.z + currentHeadOffset.z,
    )

    // Calculate lookAt point: 10 units in front of base camera position (along -Z axis)
    // This creates rotation around a distant point rather than panning
    const lookAtDistance = 10
    const lookAtPoint = new THREE.Vector3(
      theaterCameraPosition.x,
      theaterCameraPosition.y,
      theaterCameraPosition.z - lookAtDistance,
    )

    camera.lookAt(lookAtPoint)

    composer.render()
    requestAnimationFrame(tick)
  }
  tick()
})
</script>

<template>
  <div id="viewport"></div>
  <video id="headtracker-video" autoplay style="display: none"></video>
  <canvas id="headtracker-canvas" width="320" height="240" style="display: none"></canvas>
</template>

<style scoped>
#viewport {
  height: 100%;
  width: 100%;
}
</style>
