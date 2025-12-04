# Shader Library

This folder contains different shader effects you can use in your Three.js scene.

## Available Shaders

### 1. VignetteShader (`vignette-shader.ts`)
- Darkens the edges of the image to create a framing effect
- Applies gamma correction and color adjustments
- Good for cinematic look

### 2. DitherShader (`dither-shader.ts`)
- Converts to grayscale with dithering effect
- Creates a retro/pixelated aesthetic
- Uses ordered dithering algorithm

### 3. RaymarchingShader (`raymarching-shader.ts`)
- Full raymarching implementation with Phong lighting
- Renders a 3D sphere using signed distance functions
- Two animated lights orbiting the sphere
- More computationally expensive

## How to Use

In `three-setup.ts`, import the shader you want:

```typescript
import { VignetteShader } from '@/shaders/vignette-shader'
// or
import { DitherShader } from '@/shaders/dither-shader'
// or
import { RaymarchingShader } from '@/shaders/raymarching-shader'
```

Then create a pass with it:

```typescript
const shaderPass = new ShaderPass(VignetteShader)
shaderPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
composer.addPass(shaderPass)
```

For time-based shaders, update the time uniform in your animate loop:

```typescript
shaderPass.uniforms.time.value = Date.now() * 0.001
```
