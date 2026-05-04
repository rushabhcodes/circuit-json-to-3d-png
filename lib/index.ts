import type { AnyCircuitElement } from "circuit-json"
import {
  convertCircuitJsonToGltf,
  getBestCameraPosition,
} from "circuit-json-to-gltf"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import {
  CAMERA_PRESET_NAMES,
  applyCameraPreset,
  type CameraOptions,
  type CameraPreset,
} from "./camera-presets"
import { normalizeToArrayBuffer, normalizeToUint8Array } from "./binary-utils"
import { normalizeModelUrls } from "./model-paths"

export type { CameraOptions, CameraPreset }
export { CAMERA_PRESET_NAMES, applyCameraPreset }

export type CircuitJson3dBaseOptions = {
  modelPathBaseDir?: string
  projectBaseUrl?: string
  authHeaders?: { Authorization: string }
}

export type RenderCircuitJsonTo3dPngOptions = CircuitJson3dBaseOptions & {
  camera?: CameraOptions
  cameraPreset?: CameraPreset
}

const getRenderCamera = (
  circuitJson: AnyCircuitElement[],
  options: RenderCircuitJsonTo3dPngOptions = {},
): CameraOptions => {
  if (options.camera) {
    return options.camera
  }

  const defaultCamera = getBestCameraPosition(circuitJson)
  if (!options.cameraPreset) {
    return defaultCamera
  }

  return applyCameraPreset(options.cameraPreset, defaultCamera)
}

const getConversionOptions = (
  format: "gltf" | "glb",
  options: CircuitJson3dBaseOptions = {},
) => ({
  format,
  ...(options.projectBaseUrl ? { projectBaseUrl: options.projectBaseUrl } : {}),
  ...(options.authHeaders ? { authHeaders: options.authHeaders } : {}),
})

export const getDefaultCameraForCircuitJson = (
  circuitJson: AnyCircuitElement[],
): CameraOptions => getBestCameraPosition(circuitJson)

export const convertCircuitJsonTo3dGltf = async (
  circuitJson: AnyCircuitElement[],
  options: CircuitJson3dBaseOptions = {},
): Promise<unknown> => {
  const normalizedCircuitJson = normalizeModelUrls(circuitJson, options)
  return convertCircuitJsonToGltf(
    normalizedCircuitJson,
    getConversionOptions("gltf", options),
  )
}

export const convertCircuitJsonTo3dGlb = async (
  circuitJson: AnyCircuitElement[],
  options: CircuitJson3dBaseOptions = {},
): Promise<Uint8Array> => {
  const normalizedCircuitJson = normalizeModelUrls(circuitJson, options)
  const glbBuffer = await convertCircuitJsonToGltf(
    normalizedCircuitJson,
    getConversionOptions("glb", options),
  )
  return normalizeToUint8Array(glbBuffer)
}

export const renderCircuitJsonTo3dPng = async (
  circuitJson: AnyCircuitElement[],
  options: RenderCircuitJsonTo3dPngOptions = {},
): Promise<Uint8Array> => {
  const glbBuffer = await convertCircuitJsonTo3dGlb(circuitJson, options)
  const glbArrayBuffer = await normalizeToArrayBuffer(glbBuffer)
  const pngBuffer = await renderGLTFToPNGBufferFromGLBBuffer(
    glbArrayBuffer,
    getRenderCamera(circuitJson, options),
  )
  return normalizeToUint8Array(pngBuffer)
}
