import { getProject, types } from '@theatre/core'

export const theaterProject = getProject('FolderAnimation')

export const mainSheet = theaterProject.sheet('Main')

export const cameraConfig = {
  position: types.compound({
    x: types.number(0, { range: [-10, 10] }),
    y: types.number(0, { range: [-5, 5] }),
    z: types.number(-1, { range: [-10, 10] }),
  }),
}

export const modelConfig = {
  rotation: types.compound({
    x: types.number(0, { range: [-Math.PI, Math.PI] }),
    y: types.number(0, { range: [-Math.PI * 2, Math.PI * 2] }),
    z: types.number(0, { range: [-Math.PI, Math.PI] }),
  }),
  position: types.compound({
    x: types.number(0, { range: [-5, 5] }),
    y: types.number(0, { range: [-5, 5] }),
    z: types.number(-5, { range: [-50, 5] }),
  }),
}

export const lightsConfig = {
  keyLight: types.compound({
    intensity: types.number(2.0, { range: [0, 5] }),
    position: types.compound({
      x: types.number(5, { range: [-10, 10] }),
      y: types.number(8, { range: [0, 15] }),
      z: types.number(5, { range: [-10, 10] }),
    }),
  }),
  fillLight: types.compound({
    intensity: types.number(0.8, { range: [0, 5] }),
    position: types.compound({
      x: types.number(-5, { range: [-10, 10] }),
      y: types.number(3, { range: [0, 15] }),
      z: types.number(-3, { range: [-10, 10] }),
    }),
  }),
  rimLight: types.compound({
    intensity: types.number(1.5, { range: [0, 5] }),
    position: types.compound({
      x: types.number(-5, { range: [-10, 10] }),
      y: types.number(5, { range: [0, 15] }),
      z: types.number(-5, { range: [-10, 10] }),
    }),
  }),
  topLight: types.compound({
    intensity: types.number(1.0, { range: [0, 5] }),
    position: types.compound({
      x: types.number(0, { range: [-10, 10] }),
      y: types.number(10, { range: [0, 15] }),
      z: types.number(0, { range: [-10, 10] }),
    }),
  }),
}
