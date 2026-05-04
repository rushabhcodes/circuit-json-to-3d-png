import path from "node:path"
import { pathToFileURL } from "node:url"
import type { AnyCircuitElement } from "circuit-json"

const modelUrlKeys = [
  "model_glb_url",
  "glb_model_url",
  "model_stl_url",
  "stl_model_url",
  "model_obj_url",
  "obj_model_url",
  "model_gltf_url",
  "gltf_model_url",
  "model_step_url",
  "step_model_url",
] as const

const hasUriScheme = (value: string): boolean =>
  /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) && !/^[a-zA-Z]:[\\/]/.test(value)

export const normalizeModelUrls = (
  circuitJson: AnyCircuitElement[],
  options: { modelPathBaseDir?: string; projectBaseUrl?: string } = {},
): AnyCircuitElement[] => {
  const baseDir = options.modelPathBaseDir ?? process.cwd()
  const hasModelPathBaseDir = options.modelPathBaseDir != null
  const preserveRelativeModelUrls = Boolean(options.projectBaseUrl)

  return circuitJson.map((element) => {
    if (!element || typeof element !== "object") return element

    const updated = { ...element } as Record<string, unknown>
    for (const key of modelUrlKeys) {
      const value = updated[key]
      if (typeof value !== "string" || value.length === 0) continue
      if (hasUriScheme(value)) continue

      if (value.startsWith("/") && preserveRelativeModelUrls) {
        updated[key] = value
      } else if (value.startsWith("/") || value.match(/^[a-zA-Z]:\\/)) {
        updated[key] = pathToFileURL(value).href
      } else if (preserveRelativeModelUrls && !hasModelPathBaseDir) {
        updated[key] = value
      } else {
        updated[key] = pathToFileURL(path.resolve(baseDir, value)).href
      }
    }

    return updated as AnyCircuitElement
  })
}
