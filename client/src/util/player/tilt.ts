

export default function tilt(silLocal: [number, number][], restAngle: number, visLeft: number) {
    if (silLocal.length === 0) return visLeft

    let unrotMaxY = -Infinity
    let rotMaxY = -Infinity
    
    for (const [lx, ly] of silLocal) {
        if (ly > unrotMaxY) unrotMaxY = ly

        const r = (restAngle * Math.PI) / 180
        const ry = lx * Math.sin(r) + ly * Math.cos(r)
        if (ry > rotMaxY) rotMaxY = ry
    }
    
    return unrotMaxY - rotMaxY
}