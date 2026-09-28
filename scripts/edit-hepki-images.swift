import AppKit
import CoreGraphics

struct Job {
    let filename: String
    let searchRect: CGRect
    let targetCenterX: CGFloat
    let targetCenterY: CGFloat
    let targetWidth: CGFloat
    let targetHeight: CGFloat
    let angleDegrees: CGFloat
}

let root = "/Users/kartiktandon/Downloads/hire-buddy-web/public/assets/hepki-home/"

// Exact bounding boxes from pristine images:
// hospital.jpg: hepogo is at x=1060...1136, y=443...478 -> center=(1098.0, 460.5), w=77, h=36, angle=12.7 deg
// shopping.jpg: hepogo is at x=972...1061, y=431...471 -> center=(1016.5, 451.0), w=90, h=41, angle=11.9 deg
// gym.jpg: hepogo is at x=1002...1093, y=480...515 -> center=(1047.5, 497.5), w=92, h=36, angle=10.1 deg
let jobs: [Job] = [
    Job(filename: "hospital.jpg",
        searchRect: CGRect(x: 1045, y: 430, width: 105, height: 60),
        targetCenterX: 1098.0,
        targetCenterY: 460.5,
        targetWidth: 70.0,
        targetHeight: 25.0,
        angleDegrees: 12.7),

    Job(filename: "shopping.jpg",
        searchRect: CGRect(x: 955, y: 420, width: 120, height: 65),
        targetCenterX: 1016.5,
        targetCenterY: 451.0,
        targetWidth: 80.0,
        targetHeight: 27.0,
        angleDegrees: 11.9),

    Job(filename: "gym.jpg",
        searchRect: CGRect(x: 985, y: 465, width: 125, height: 65),
        targetCenterX: 1047.5,
        targetCenterY: 497.5,
        targetWidth: 82.0,
        targetHeight: 27.0,
        angleDegrees: 10.1)
]

for job in jobs {
    let fullPath = root + job.filename
    guard let nsImage = NSImage(contentsOfFile: fullPath),
          let rep = nsImage.representations.first as? NSBitmapImageRep,
          let data = rep.bitmapData else {
        fatalError("Failed to open \(fullPath)")
    }
    let w = rep.pixelsWide
    let h = rep.pixelsHigh
    let bpr = rep.bytesPerRow
    let bpp = rep.bitsPerPixel / 8

    let x0 = Int(job.searchRect.minX)
    let x1 = Int(job.searchRect.maxX)
    let y0 = Int(job.searchRect.minY)
    let y1 = Int(job.searchRect.maxY)

    // 1. Identify all pixels of the white letters in standard top-down image coordinates
    var letterMask = [Bool](repeating: false, count: w * h)
    for y in y0..<y1 {
        for x in x0..<x1 {
            let offset = y * bpr + x * bpp
            let r = Int(data[offset])
            let g = Int(data[offset + 1])
            let b = Int(data[offset + 2])
            // Pure blue shirt has low red & green:
            // Letter pixels have distinctly higher red or green or both:
            if (r > 35 && g > 75) || (r > 55) || (g > 95) || (r + g > 120) {
                letterMask[y * w + x] = true
            }
        }
    }

    // 2. Dilate the mask by 3 pixels in all directions to catch every anti-aliased edge pixel
    var dilated = letterMask
    for y in y0..<y1 {
        for x in x0..<x1 where letterMask[y * w + x] {
            for dy in -3...3 {
                for dx in -3...3 {
                    let xx = x + dx, yy = y + dy
                    if xx >= x0 - 4 && xx < x1 + 4 && yy >= y0 - 4 && yy < y1 + 4 {
                        dilated[yy * w + xx] = true
                    }
                }
            }
        }
    }

    // 3. Inpaint letter pixels from surrounding blue fabric pixels
    var cleanBytes = [UInt8](repeating: 0, count: h * bpr)
    for i in 0..<(h * bpr) { cleanBytes[i] = data[i] }

    let directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]
    for y in (y0 - 4)..<(y1 + 4) {
        for x in (x0 - 4)..<(x1 + 4) where dilated[y * w + x] {
            var red = 0.0, green = 0.0, blue = 0.0, totalWeight = 0.0
            for (dx, dy) in directions {
                for dist in 1...25 {
                    let xx = x + dx * dist, yy = y + dy * dist
                    if xx < 0 || xx >= w || yy < 0 || yy >= h { continue }
                    if !dilated[yy * w + xx] {
                        let offset = yy * bpr + xx * bpp
                        let weight = 1.0 / Double(dist * dist)
                        red += Double(data[offset]) * weight
                        green += Double(data[offset + 1]) * weight
                        blue += Double(data[offset + 2]) * weight
                        totalWeight += weight
                        break
                    }
                }
            }
            if totalWeight > 0 {
                let offset = y * bpr + x * bpp
                cleanBytes[offset] = UInt8(max(0, min(255, Int(red / totalWeight))))
                cleanBytes[offset + 1] = UInt8(max(0, min(255, Int(green / totalWeight))))
                cleanBytes[offset + 2] = UInt8(max(0, min(255, Int(blue / totalWeight))))
            }
        }
    }

    // 4. Create an NSBitmapImageRep with the cleaned pixel buffer
    guard let cleanRep = NSBitmapImageRep(bitmapDataPlanes: nil,
                                          pixelsWide: w,
                                          pixelsHigh: h,
                                          bitsPerSample: 8,
                                          samplesPerPixel: bpp,
                                          hasAlpha: (bpp == 4),
                                          isPlanar: false,
                                          colorSpaceName: .deviceRGB,
                                          bytesPerRow: bpr,
                                          bitsPerPixel: bpp * 8) else {
        fatalError("Could not create cleanRep")
    }
    cleanBytes.withUnsafeBytes { rawPtr in
        if let base = rawPtr.baseAddress, let dst = cleanRep.bitmapData {
            memcpy(dst, base, h * bpr)
        }
    }

    // 5. Draw onto CGContext with high quality
    let cs = CGColorSpaceCreateDeviceRGB()
    guard let cgClean = cleanRep.cgImage,
          let ctx = CGContext(data: nil,
                              width: w,
                              height: h,
                              bitsPerComponent: 8,
                              bytesPerRow: 0,
                              space: cs,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        fatalError("Could not create ctx")
    }
    ctx.draw(cgClean, in: CGRect(x: 0, y: 0, width: w, height: h))

    // 6. Draw clean "hepki" text
    let gc = NSGraphicsContext(cgContext: ctx, flipped: false)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = gc

    // High quality font: Helvetica-BoldOblique or Arial italic bold
    let font = NSFont(name: "Helvetica-BoldOblique", size: 24) ?? NSFont.systemFont(ofSize: 24, weight: .bold)
    let text = NSAttributedString(string: "hepki", attributes: [
        .font: font,
        .foregroundColor: NSColor(calibratedWhite: 0.96, alpha: 0.98),
        .kern: -0.5
    ])
    let textSize = text.size()

    let cocoaCenterX = job.targetCenterX
    let cocoaCenterY = CGFloat(h) - job.targetCenterY
    let cocoaAngleRad = -job.angleDegrees * .pi / 180.0

    ctx.saveGState()
    ctx.translateBy(x: cocoaCenterX, y: cocoaCenterY)
    ctx.rotate(by: cocoaAngleRad)
    let textOrigin = CGPoint(x: -textSize.width / 2.0, y: -textSize.height / 2.0)
    text.draw(at: textOrigin)
    ctx.restoreGState()

    NSGraphicsContext.restoreGraphicsState()

    // 7. Save output
    guard let finalCG = ctx.makeImage(),
          let finalData = NSBitmapImageRep(cgImage: finalCG).representation(using: .jpeg, properties: [.compressionFactor: 0.98]) else {
        fatalError("Could not write jpeg")
    }
    try finalData.write(to: URL(fileURLWithPath: fullPath), options: .atomic)
    print("Perfectly updated \(job.filename)")
}