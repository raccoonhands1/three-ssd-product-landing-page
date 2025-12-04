import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'

export function setupLights(scene: THREE.Scene) {
  // Soft ambient fill
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  // Key light - main light source (front, slightly above and to the side)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
  keyLight.position.set(5, 8, 5)
  keyLight.target.position.set(0, 0, 0)
  scene.add(keyLight)
  scene.add(keyLight.target)

  // Fill light - softer light to fill in shadows (opposite side of key)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8)
  fillLight.position.set(-5, 3, 3)
  fillLight.target.position.set(0, 0, 0)
  scene.add(fillLight)
  scene.add(fillLight.target)

  // Rim/Back light - creates separation from background (behind and above)
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5)
  rimLight.position.set(0, 5, -5)
  rimLight.target.position.set(0, 0, 0)
  scene.add(rimLight)
  scene.add(rimLight.target)

  // Top light - adds highlights from above
  const topLight = new THREE.DirectionalLight(0xffffff, 0.6)
  topLight.position.set(0, 10, 0)
  topLight.target.position.set(0, 0, 0)
  scene.add(topLight)
  scene.add(topLight.target)

  return { ambientLight, keyLight, fillLight, rimLight, topLight }
}

export function threeSetup() {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(2, 1, 3)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(window.devicePixelRatio)

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  return { scene, camera, renderer, composer }
}

export async function loadAllModels(scene: THREE.Scene) {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('/3d/file_doll.glb')
  gltf.scene.position.y = -2
  gltf.scene.scale.setScalar(3)

  scene.add(gltf.scene)

  let bagBone = null

  const bone = gltf.scene.getObjectByName('Bone')
  if (bone) {
    bagBone = bone
    if (bagBone) {
      const up = new THREE.Vector3(0, 1, 0)
      const initialRotation = new THREE.Quaternion().setFromAxisAngle(up, Math.PI)
      bagBone.quaternion.copy(initialRotation)
    }
  }

  const damping = 0.98
  const gravity = 9.82
  const length = 2

  return {
    punchingBag: gltf.scene,
    bagBone,
    damping,
    gravity,
    length,
  }
}

export function animate(composer: EffectComposer, model: THREE.Group) {
  requestAnimationFrame(() => animate(composer, model))

  model.rotation.y += 0.005

  composer.render()
}
