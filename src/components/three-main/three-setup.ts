import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { mainSheet, cameraConfig, modelConfig, lightsConfig } from './theater-config'

export function setupLights(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
  keyLight.position.set(5, 8, 5)
  keyLight.target.position.set(0, 0, 0)
  scene.add(keyLight)
  scene.add(keyLight.target)

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8)
  fillLight.position.set(-5, 3, 3)
  fillLight.target.position.set(0, 0, 0)
  scene.add(fillLight)
  scene.add(fillLight.target)

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5)
  rimLight.position.set(0, 5, -5)
  rimLight.target.position.set(0, 0, 0)
  scene.add(rimLight)
  scene.add(rimLight.target)

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
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(window.devicePixelRatio)

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  // Add test cubes at varying depths
  const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)

  // Foreground cube (closest) - Red
  const foregroundCube = new THREE.Mesh(
    cubeGeometry,
    new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
  )
  foregroundCube.position.set(-2, 1, 1)
  scene.add(foregroundCube)

  // Mid-ground cube - Green
  const midgroundCube = new THREE.Mesh(
    cubeGeometry,
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
  )
  midgroundCube.position.set(2, 1, 0)
  scene.add(midgroundCube)

  // Background cube (farthest) - Blue
  const backgroundCube = new THREE.Mesh(
    cubeGeometry,
    new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
  )
  backgroundCube.position.set(0, -1, -2)
  scene.add(backgroundCube)

  const cameraObj = mainSheet.object('Camera', cameraConfig)
  const modelObj = mainSheet.object('Model', modelConfig)
  const lightsObj = mainSheet.object('Lights', lightsConfig)

  return {
    scene,
    camera,
    renderer,
    composer,
    theaterObjects: { cameraObj, modelObj, lightsObj }
  }
}

export async function loadAllModels(scene: THREE.Scene) {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('/3d/windows_file_folder.glb')
  gltf.scene.position.y = -2
  gltf.scene.scale.setScalar(0.01)
  gltf.scene.rotation.y = Math.PI / 2

  scene.add(gltf.scene)

  let bagBone = null
  let outlineBone = null

  const bone = gltf.scene.getObjectByName('Bone')
  if (bone) {
    bagBone = bone
    if (bagBone) {
      const up = new THREE.Vector3(0, 1, 0)
      const initialRotation = new THREE.Quaternion().setFromAxisAngle(up, Math.PI)
      bagBone.quaternion.copy(initialRotation)
    }
  }

  const outlineGroup = gltf.scene.clone()
  outlineGroup.position.y = -2
  outlineGroup.scale.setScalar(0.01 * 1.001)
  outlineGroup.rotation.y = Math.PI / 2

  const replacementMap = new Map<THREE.Object3D, THREE.LineSegments>()

  outlineGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const edges = new THREE.EdgesGeometry(mesh.geometry, 15)
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
      const lineSegments = new THREE.LineSegments(edges, lineMaterial)

      // copy transformations
      lineSegments.position.copy(mesh.position)
      lineSegments.rotation.copy(mesh.rotation)
      lineSegments.scale.copy(mesh.scale)
      lineSegments.quaternion.copy(mesh.quaternion)

      replacementMap.set(mesh, lineSegments)
    }
  })

  for (const [mesh, outline] of replacementMap.entries()) {
    if (mesh.parent) {
      mesh.parent.add(outline)
      mesh.parent.remove(mesh)
    }
  }

  if (bagBone) {
    outlineGroup.traverse((child) => {
      if (child.name === 'Bone') {
        outlineBone = child
      }
    })

    if (outlineBone) {
      const up = new THREE.Vector3(0, 1, 0)
      const initialRotation = new THREE.Quaternion().setFromAxisAngle(up, Math.PI)
      outlineBone.quaternion.copy(initialRotation)
    }
  }

  if (bagBone) {
    outlineGroup.traverse((child) => {
      if (child.name === 'Bone') {
        outlineBone = child
      }
    })

    if (outlineBone) {
      const up = new THREE.Vector3(0, 1, 0)
      const initialRotation = new THREE.Quaternion().setFromAxisAngle(up, Math.PI)
      outlineBone.quaternion.copy(initialRotation)
    }
  }

  scene.add(outlineGroup)

  return {
    punchingBag: gltf.scene,
    wireframeModel: outlineGroup,
    bagBone,
    outlineBone,
  }
}
