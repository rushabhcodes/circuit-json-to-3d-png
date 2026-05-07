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

const isWindowsAbsolutePath = (value: string): boolean =>
  /^[a-zA-Z]:[\\/]/.test(value)

const getDefaultBaseDir = (): string | undefined => {
  if (
    typeof process !== "undefined" &&
    process &&
    typeof process.cwd === "function"
  ) {
    return process.cwd()
  }

  return undefined
}

const toFileUrl = (value: string): string => {
  const normalizedPath = value.replace(/\\/g, "/")
  const pathname = isWindowsAbsolutePath(value)
    ? `/${normalizedPath}`
    : normalizedPath

  return new URL(`file://${encodeURI(pathname)}`).href
}

const toDirectoryUrl = (value: string): string => {
  if (hasUriScheme(value)) {
    return value.endsWith("/") ? value : `${value}/`
  }

  const directoryPath =
    value.endsWith("/") || value.endsWith("\\") ? value : `${value}/`
  return toFileUrl(directoryPath)
}

export const normalizeModelUrls = (
  circuitJson: AnyCircuitElement[],
  options: { modelPathBaseDir?: string; projectBaseUrl?: string } = {},
): AnyCircuitElement[] => {
  const baseDir = options.modelPathBaseDir ?? getDefaultBaseDir()
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
      } else if (value.startsWith("/") || isWindowsAbsolutePath(value)) {
        updated[key] = toFileUrl(value)
      } else if (preserveRelativeModelUrls && !hasModelPathBaseDir) {
        updated[key] = value
      } else if (!baseDir) {
        updated[key] = value
      } else {
        updated[key] = new URL(value, toDirectoryUrl(baseDir)).href
      }
    }

    return updated as AnyCircuitElement
  })
}
