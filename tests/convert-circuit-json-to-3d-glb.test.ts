import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import basicBoardFixtureJson from "./fixtures/basic-board.fixture.json"
import { convertCircuitJsonTo3dGlb } from "lib/index"

const basicBoardFixture = basicBoardFixtureJson as AnyCircuitElement[]

test("convertCircuitJsonTo3dGlb returns a valid GLB buffer", async () => {
  const glb = await convertCircuitJsonTo3dGlb(basicBoardFixture)

  expect(glb.byteLength).toBeGreaterThan(0)
  expect(glb[0]).toBe(0x67)
  expect(glb[1]).toBe(0x6c)
  expect(glb[2]).toBe(0x54)
  expect(glb[3]).toBe(0x46)
}, 60_000)
