import { EXERCISE_PHOTO_MAX_SIDE, EXERCISE_PHOTO_QUALITY } from '../config'

/** Réduit une photo (grand côté ≤ EXERCISE_PHOTO_MAX_SIDE) et la recompresse en JPEG. */
export async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, EXERCISE_PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image illisible'))),
      'image/jpeg',
      EXERCISE_PHOTO_QUALITY
    )
  )
}
