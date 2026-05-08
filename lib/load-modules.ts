type CircuitJsonToGltfModule = typeof import("circuit-json-to-gltf")
type PoppyGlModule = typeof import("poppygl")

let circuitJsonToGltfModulePromise: Promise<CircuitJsonToGltfModule> | null =
  null
let poppyGlModulePromise: Promise<PoppyGlModule> | null = null

export const loadCircuitJsonToGltf =
  async (): Promise<CircuitJsonToGltfModule> => {
    circuitJsonToGltfModulePromise ??= import("circuit-json-to-gltf")
    return circuitJsonToGltfModulePromise
  }

export const loadPoppyGl = async (): Promise<PoppyGlModule> => {
  poppyGlModulePromise ??= import("poppygl")
  return poppyGlModulePromise
}
