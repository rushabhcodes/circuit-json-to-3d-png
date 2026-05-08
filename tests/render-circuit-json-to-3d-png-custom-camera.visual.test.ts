import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
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
  const snapshotPath = path.join(
    import.meta.dir,
    "__snapshots__",
    "basic-board-custom-camera.png",
  )

  expect(png[0]).toBe(0x89)
  expect(png[1]).toBe(0x50)
  expect(png[2]).toBe(0x4e)
  expect(png[3]).toBe(0x47)

  await mkdir(path.dirname(snapshotPath), { recursive: true })
  try {
    const expected = await readFile(snapshotPath)
    expect(png).toEqual(expected)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error
    }

    await writeFile(snapshotPath, png)
  }
}, 60_000)
