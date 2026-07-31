// Client-side NSFW check before an offer photo is uploaded. Runs a small
// TensorFlow.js model (loaded on demand, not bundled into the main chunk)
// against each image; nothing leaves the browser for this check. This is a
// deterrent, not a guarantee — someone hitting the Storage API directly
// bypasses it, which is what the "Melden" button and manual review are for.
const UNSAFE_CLASSES = new Set(['Porn', 'Hentai', 'Sexy'])
const UNSAFE_THRESHOLD = 0.6

let modelPromise: ReturnType<typeof loadModel> | null = null

// Import "nsfwjs/core" + only the MobileNetV2 model directly, instead of the
// top-level "nsfwjs" entry point: that one eagerly imports *all three*
// bundled models (including InceptionV3, tens of MB of weights) regardless
// of which one is actually used, since nsfwjs ships model weights as local
// importable JS modules rather than fetching them from a URL at runtime.
async function loadModel() {
  const [{ load }, { MobileNetV2Model }] = await Promise.all([
    import('nsfwjs/core'),
    import('nsfwjs/models/mobilenet_v2'),
  ])
  return load(MobileNetV2Model.name, { modelDefinitions: [MobileNetV2Model] })
}

function getModel() {
  if (!modelPromise) modelPromise = loadModel()
  return modelPromise
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'))
    img.src = src
  })
}

export async function isImageSafe(file: File): Promise<boolean> {
  const model = await getModel()
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageElement(objectUrl)
    const predictions = await model.classify(image)
    return !predictions.some((p) => UNSAFE_CLASSES.has(p.className) && p.probability >= UNSAFE_THRESHOLD)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
