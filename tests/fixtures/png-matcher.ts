import { expect, type MatcherResult } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"

async function toMatchPngSnapshot(
  // biome-ignore lint/suspicious/noExplicitAny: bun matcher context typing
  this: any,
  receivedMaybePromise: Buffer | Uint8Array | Promise<Buffer | Uint8Array>,
  testPathOriginal: string,
  pngName?: string,
): Promise<MatcherResult> {
  const received = await receivedMaybePromise
  const testPath = testPathOriginal
    .replace(/\.test\.tsx?$/, "")
    .replace(/\.visual\.test\.ts$/, "")
  const snapshotDir = path.join(path.dirname(testPath), "__snapshots__")
  const snapshotName = pngName
    ? pngName.endsWith(".png")
      ? pngName
      : `${pngName}.snap.png`
    : `${path.basename(testPath)}.snap.png`
  const filePath = path.join(snapshotDir, snapshotName)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  const updateSnapshot =
    process.argv.includes("--update-snapshots") ||
    process.argv.includes("-u") ||
    Boolean(process.env["BUN_UPDATE_SNAPSHOTS"])
  const forceUpdate = Boolean(process.env["FORCE_BUN_UPDATE_SNAPSHOTS"])

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, received)
    return {
      message: () => `PNG snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath)
  const result: any = await looksSame(
    Buffer.from(received),
    Buffer.from(existingSnapshot),
    {
      strict: false,
      tolerance: 5,
      antialiasingTolerance: 4,
      ignoreCaret: true,
      shouldCluster: true,
      clustersSize: 10,
    },
  )

  if (updateSnapshot) {
    if (!forceUpdate && result.equal) {
      return {
        message: () => "PNG snapshot matches",
        pass: true,
      }
    }

    fs.writeFileSync(filePath, received)
    return {
      message: () => `PNG snapshot updated at ${filePath}`,
      pass: true,
    }
  }

  if (result.equal) {
    return {
      message: () => "PNG snapshot matches",
      pass: true,
    }
  }

  if (result.diffBounds) {
    const width = existingSnapshot.readUInt32BE(16)
    const height = existingSnapshot.readUInt32BE(20)
    const totalPixels = width * height
    const diffArea =
      (result.diffBounds.right - result.diffBounds.left) *
      (result.diffBounds.bottom - result.diffBounds.top)
    const diffPercentage = (diffArea / totalPixels) * 100
    const acceptableDiffPercentage = 5

    if (diffPercentage <= acceptableDiffPercentage) {
      return {
        message: () =>
          `PNG snapshot matches (${diffPercentage.toFixed(3)}% difference)`,
        pass: true,
      }
    }

    const diffPath = filePath.replace(/\.png$/, ".diff.png")
    await looksSame.createDiff({
      reference: Buffer.from(existingSnapshot),
      current: Buffer.from(received),
      diff: diffPath,
      highlightColor: "#ff00ff",
    })

    return {
      message: () =>
        `PNG snapshot differs by ${diffPercentage.toFixed(3)}% (threshold: ${acceptableDiffPercentage}%). Diff saved at ${diffPath}. Use BUN_UPDATE_SNAPSHOTS=1 to update the snapshot.`,
      pass: false,
    }
  }

  const diffPath = filePath.replace(/\.png$/, ".diff.png")
  await looksSame.createDiff({
    reference: Buffer.from(existingSnapshot),
    current: Buffer.from(received),
    diff: diffPath,
    highlightColor: "#ff00ff",
  })

  return {
    message: () => `PNG snapshot does not match. Diff saved at ${diffPath}`,
    pass: false,
  }
}

expect.extend({
  toMatchPngSnapshot: toMatchPngSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchPngSnapshot(
      testPath: string,
      pngName?: string,
    ): Promise<MatcherResult>
  }
}
