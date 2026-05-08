export type CameraOptions = {
  camPos: readonly [number, number, number]
  lookAt: readonly [number, number, number]
  fov: number
}

function normalizeDir(dir: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2)
  if (len === 0) return [0, 1, 0]
  return [dir[0] / len, dir[1] / len, dir[2] / len]
}

function distance(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

function repositionCamera(
  cam: CameraOptions,
  dir: [number, number, number],
  distOverride?: number,
): CameraOptions {
  const dist = distOverride ?? distance(cam.camPos, cam.lookAt)
  const [nx, ny, nz] = normalizeDir(dir)
  return {
    camPos: [
      cam.lookAt[0] + nx * dist,
      cam.lookAt[1] + ny * dist,
      cam.lookAt[2] + nz * dist,
    ] as const,
    lookAt: cam.lookAt,
    fov: cam.fov,
  }
}

export const CAMERA_PRESETS = {
  "top-down": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [0.00000001, 1, -0.001]),
  "top-down-ortho": (cam: CameraOptions): CameraOptions => {
    const desiredFov = 3
    const dir: [number, number, number] = [0.00000001, 1, -0.001]
    const origDist = distance(cam.camPos, cam.lookAt)
    const origFovRad = Math.max((cam.fov * Math.PI) / 180, 0.01)
    const desiredFovRad = Math.max((desiredFov * Math.PI) / 180, 0.01)
    const tanOrig = Math.tan(origFovRad / 2)
    const tanDesired = Math.max(Math.tan(desiredFovRad / 2), 0.0001)
    const distScale =
      Number.isFinite(tanOrig / tanDesired) && tanOrig > 0
        ? tanOrig / tanDesired
        : 1
    const newDist = origDist * distScale
    const repositioned = repositionCamera(cam, dir, newDist)
    return { ...repositioned, fov: desiredFov }
  },
  "top-left-corner": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [0.7, 1.2, -0.8]),
  "top-left": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [1, 1.2, 0]),
  "top-right-corner": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [-0.7, 1.2, -0.8]),
  "top-right": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [-1, 1.2, 0]),
  "left-sideview": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [1, 0.05, 0]),
  "right-sideview": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [-1, 0.05, 0]),
  front: (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [0, 0.05, -1]),
  "top-center-angled": (cam: CameraOptions): CameraOptions =>
    repositionCamera(cam, [0, 1, -1]),
} as const

export type CameraPreset = keyof typeof CAMERA_PRESETS

export const CAMERA_PRESET_NAMES = Object.keys(CAMERA_PRESETS) as CameraPreset[]

export function applyCameraPreset(
  preset: CameraPreset,
  cam: CameraOptions,
): CameraOptions {
  if (!(preset in CAMERA_PRESETS)) {
    throw new Error(
      `Unknown camera preset "${preset}". Valid presets: ${CAMERA_PRESET_NAMES.join(", ")}`,
    )
  }
  return CAMERA_PRESETS[preset](cam)
}
