import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import basicBoardFixtureJson from "./fixtures/basic-board.fixture.json"
import {
  CAMERA_PRESET_NAMES,
  applyCameraPreset,
  getDefaultCameraForCircuitJson,
  renderCircuitJsonTo3dPng,
} from "lib/index"

const basicBoardFixture = basicBoardFixtureJson as AnyCircuitElement[]
const cameraPresetSnapshotDir = path.join(
  import.meta.dir,
  "__snapshots__",
  "camera-presets.test",
)

test("camera presets change the default camera position", async () => {
  const defaultCamera = getDefaultCameraForCircuitJson(basicBoardFixture)

  for (const preset of CAMERA_PRESET_NAMES) {
    const presetCamera = applyCameraPreset(preset, defaultCamera)
    expect(presetCamera.lookAt).toEqual(defaultCamera.lookAt)
    expect(Number.isFinite(presetCamera.fov)).toBe(true)
    expect(presetCamera.camPos).not.toEqual(defaultCamera.camPos)

    const png = await renderCircuitJsonTo3dPng(basicBoardFixture, {
      cameraPreset: preset,
    })
    expect(png.byteLength).toBeGreaterThan(0)
    expect(png[0]).toBe(0x89)
    expect(png[1]).toBe(0x50)
    expect(png[2]).toBe(0x4e)
    expect(png[3]).toBe(0x47)

    const snapshotPath = path.join(cameraPresetSnapshotDir, `${preset}.png`)
    await mkdir(cameraPresetSnapshotDir, { recursive: true })
    try {
      const expected = await readFile(snapshotPath)
      expect(Array.from(png)).toEqual(Array.from(expected))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error
      }

      await writeFile(snapshotPath, png)
    }
  }
}, 120_000)
