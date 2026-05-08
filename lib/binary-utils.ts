const viewToArrayBuffer = (view: ArrayBufferView): ArrayBuffer => {
  const copy = new Uint8Array(view.byteLength)
  copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
  return copy.buffer
}

type ArrayBufferLikeObject = {
  arrayBuffer?: () => Promise<ArrayBuffer> | ArrayBuffer
}

export type ArrayBufferInput =
  | ArrayBuffer
  | ArrayBufferView
  | ArrayBufferLikeObject

export type Uint8ArrayInput = ArrayBuffer | ArrayBufferView

export const normalizeToArrayBuffer = async (
  value: ArrayBufferInput,
): Promise<ArrayBuffer> => {
  if (value instanceof ArrayBuffer) {
    return value
  }

  if (ArrayBuffer.isView(value)) {
    return viewToArrayBuffer(value as ArrayBufferView)
  }

  if ("arrayBuffer" in value && typeof value.arrayBuffer === "function") {
    const result = value.arrayBuffer()
    return result instanceof Promise ? await result : result
  }

  throw new Error(
    "Expected ArrayBuffer, ArrayBufferView, or Buffer-compatible object",
  )
}

export const normalizeToUint8Array = (value: Uint8ArrayInput): Uint8Array => {
  if (value instanceof Uint8Array) {
    return value
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value)
  }

  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(viewToArrayBuffer(value as ArrayBufferView))
  }

  throw new Error("Expected Uint8Array, ArrayBuffer, or ArrayBufferView")
}
