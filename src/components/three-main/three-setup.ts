import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

const DitherShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    varying vec2 vUv;

    #define DITHER_LEVELS 3.

    float dither( float v, vec2 fragCoord )
    {
        float x = v * DITHER_LEVELS;

        int ditherLevel = int(floor(fract( x ) * 4.));

        float dither = 0.;

        int ix = int(fragCoord.x);
        int iy = int(fragCoord.y);

        if (ditherLevel == 1) {
            if (ix % 4 == (2*iy) % 4) {
                dither = 1.;
            }
        }

        else if (ditherLevel == 2) {
            if (ix % 2 != iy % 2) {
                dither = 1.;
            }
        }

        else if (ditherLevel == 3) {
            if (ix % 4 != (2*iy) % 4) {
                dither = 1.;
            }
        }

        return floor(x + dither) / DITHER_LEVELS;
    }

    void main() {
      vec2 fragCoord = vUv * resolution;
      vec4 color = texture2D(tDiffuse, vUv);

      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gray = dither(gray, fragCoord);

      gl_FragColor = vec4(vec3(gray), color.a);
    }
  `,
}

export function setupLights(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5)
  directionalLight.position.set(3, -3, 3)
  directionalLight.target.position.set(0, -3, 0)
  scene.add(directionalLight)
  scene.add(directionalLight.target)

  const backLight = new THREE.DirectionalLight(0xffffff, 0.8)
  backLight.position.set(-5, 3, -5)
  backLight.target.position.set(0, -3, 0)
  scene.add(backLight)
  scene.add(backLight.target)

  return { ambientLight, directionalLight, backLight }
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

  const ditherPass = new ShaderPass(DitherShader)
  ditherPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
  composer.addPass(ditherPass)

  return { scene, camera, renderer, composer }
}

export async function loadAllModels(scene: THREE.Scene) {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('/3d/file_doll.glb')
  gltf.scene.position.y = -2
  gltf.scene.scale.x = 3
  gltf.scene.scale.y = 3
  gltf.scene.scale.z = 3

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

export function animate(composer: EffectComposer, directionalLight: THREE.DirectionalLight) {
  requestAnimationFrame(() => animate(composer, directionalLight))

  const time = Date.now() * 0.0005
  const swayAmount = 2
  directionalLight.position.x = 5 + Math.sin(time) * swayAmount
  directionalLight.position.z = 5 + Math.cos(time * 0.7) * swayAmount

  composer.render()
}
