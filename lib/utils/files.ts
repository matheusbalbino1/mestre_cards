// lib/utils/files.ts
import * as FileSystem from "expo-file-system"

export async function saveImageToAppDir(
  srcUri: string,
  filenameHint = "front"
): Promise<string> {
  const dir = FileSystem.documentDirectory + "images/"
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(
    () => {}
  )
  const ext = srcUri.split(".").pop()?.split("?")[0] || "jpg"
  const dest = `${dir}${filenameHint}-${Date.now()}.${ext}`
  await FileSystem.copyAsync({ from: srcUri, to: dest })
  return dest // use este uri no card
}

export async function deleteIfExists(uri?: string | null) {
  if (!uri) return
  try {
    const info = await FileSystem.getInfoAsync(uri)
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true })
  } catch {}
}
