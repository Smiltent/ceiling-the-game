

// create a convex polygon around the nontransp. pixels
export default async function opaqueHull(src: string, alphaTresh: number = 10, flatInset: number = 16) {
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
    const edge: [number, number][] = []
    
    let mass = 0
    let sumX = 0
    let sumY = 0

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (alphaAt(x, y) <= alphaTresh) continue

            mass++
            sumX += x
            sumY += y

            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nx = x + dx
                const ny = y + dy
                if (nx < 0 || ny < 0 || nx >= width || ny >= height || alphaAt(nx, ny) <= alphaTresh) {
                    edge.push([x, y])
                    break
                }
            }
        }
    }

    const nat = convexHull(edge)
    const restAngle = supportingRestAngle(
        nat,
        mass > 0 ? sumX / mass : width / 2,
        mass > 0 ? sumY / mass : height / 2,
    )

    const bottoms = new Array<number>(width).fill(-1)
    for (let x = 0; x < width; x++) {
        for (let y = height - 1; y >= 0; y--) {
            if (alphaAt(x, y) > alphaTresh) {
                bottoms[x] = y
                break
            }
        }
    }

    const x0 = Math.min(flatInset, Math.floor(width / 2) - 1)
    const x1 = Math.max(width - 1 - flatInset, x0)
    
    let floorY = 0
    for (let x = x0; x <= x1; x++) {
        if (bottoms[x] > floorY) floorY = bottoms[x]
    }

    const bx0 = x0
    const bx1 = x1
    // while (bx0 < bx1 && bottoms[bx0] < floorY - 3) bx0++
    // while (bx1 > bx0 && bottoms[bx1] < floorY - 3) bx1--

    const pts: [number, number][] = [
        ...edge,
        [bx0, floorY],
        [bx1, floorY],
        ...Array.from({ length: Math.max(1, bx1 - bx0) }, (_, i) => {
            return [bx0 + i, floorY] as [number, number]
        }),
    ]

    const filtered = pts.filter(([x, y]) => {
        // if (x >= bx0 && x <= bx1 && y > floorY) return false
        // if (x >= bx0 && x <= bx1 && y >= floorY - 1 && y < floorY) return false

        if (x >= bx0 && x <= bx1 && y >= floorY - 2) return false
        return true
    })

    filtered.push([bx0, floorY], [bx1, floorY])
    return { hull: convexHull(filtered), nat, restAngle}
}

function convexHull(points: [number, number][]): [number, number][] {
    const edge = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const uniq: [number, number][] = []

    for (const p of edge) {
        const last = uniq[uniq.length - 1]
        if (last && last[0] === p[0] && last[1] === p[1]) continue
        uniq.push(p)
    }

    const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    
    const lower: number[][] = []
    const upper: number[][] = []

    for (const p of uniq) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop()
        }
        lower.push(p)
    }

    for (const p of [...uniq].reverse()) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop()
        }
        upper.push(p)
    }

    return [...lower.slice(0, -1), ...upper.slice(0, -1)] as [number, number][]
}

function supportingRestAngle(hull: [number, number][], comX: number, comY: number) {
    let bestAngle = 0
    let bestAbs = Infinity

    for (let i = 0; i < hull.length; i++) {
        const a = hull[i]
        const b = hull[(i + 1) % hull.length]

        const dx = b[0] - a[0]
        const dy = b[1] - a[1]

        const len = Math.hypot(dx, dy)
        if (len < 8) continue

        const ox = comX - a[0]
        const oy = comY - a[1]

        const t = (ox * dx + oy * dy) / (len * len)
        if (t < 0 || t > 1) continue

        let theta = -Math.atan2(dy, dx)
        let ry = ox * Math.sin(theta) + oy * Math.cos(theta)
        if (ry > 0) {
            theta += Math.PI
            ry = -ry
        }

        if (ry >= 0) continue

        let angle = (theta * 180) / Math.PI
        while (angle > 180) angle -= 360
        while (angle < -180) angle += 360

        if (Math.abs(angle) < bestAbs) {
            bestAbs = Math.abs(angle)
            bestAngle = angle
        }
    }

    return bestAngle
}