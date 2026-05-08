import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import "./fixtures/png-matcher"
import basicBoardFixtureJson from "./fixtures/basic-board.fixture.json"
import { renderCircuitJsonTo3dPng } from "lib/index"

const basicBoardFixture = basicBoardFixtureJson as AnyCircuitElement[]

test("custom camera overrides cameraPreset during PNG render", async () => {
  const customCamera = {
    camPos: [0, 80, 20],
    lookAt: [0, 0, 0],
    fov: 25,
  } as const

  const png = await renderCircuitJsonTo3dPng(basicBoardFixture, {
    camera: customCamera,
    cameraPreset: "front",
  })

  expect(png[0]).toBe(0x89)
  expect(png[1]).toBe(0x50)
  expect(png[2]).toBe(0x4e)
  expect(png[3]).toBe(0x47)
  await expect(png).toMatchPngSnapshot(
    import.meta.path,
    "basic-board-custom-camera.png",
  )
}, 60_000)
