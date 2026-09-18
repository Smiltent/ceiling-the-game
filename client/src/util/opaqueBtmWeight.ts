
// makes the bottom pixels of a opaque'd sprite heavier (more mass)
export default async function opaqueBtmWeight(src: string, opts: { alphaThresh?: number; edge?: number } = {}) {
    const alphaThresh = opts.alphaThresh ?? 10
    const edge = opts.edge ?? 16

    const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image()
        el.onload = () => res(el)
        el.onerror = rej
        el.src = src
    })

    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height

    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)

    const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height)
    const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3]
    const xSt = Math.min(edge, Math.floor(width / 2) - 1)
    const xEn = Math.max(width - 1 - edge, xSt)

    let mass = 0
    let sumX = 0
    let sumY = 0

    for (let x = xSt; x <= xEn; x++) {
        let bottomY = -1
        for (let y = height - 1; y >= 0; y--) {
            if (alphaAt(x, y) > alphaThresh) {
                bottomY = y
                break
            }
        }

        if (bottomY < 0) continue
        mass += 1
        sumX += x
        sumY += bottomY
    }

    if (mass <= 0) {
        return { mass: 0, comX: 0, comY: height * 0.25 }
    }

    return {
        mass,
        comX: sumX / mass - width / 2,
        comY: sumY / mass - height / 2,
    }
}