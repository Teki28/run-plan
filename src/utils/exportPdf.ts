import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Capture a DOM element to a multi-page A4 PDF with smart page breaks.
 *
 * Sections marked with `data-pdf-section` are never split across pages.
 * Remaining space on each page is filled with the canvas background color
 * and subtle running-themed decorative art.
 */

const A4_W_MM = 210
const A4_H_MM = 297

// Design-system colors (resolved hex)
const BG = { r: 17, g: 17, b: 16 }         // #111110  canvas
const BORDER = { r: 46, g: 45, b: 42 }      // #2E2D2A  border/ash
const EMBER = { r: 224, g: 123, b: 57 }     // #E07B39
const MUTED = { r: 122, g: 120, b: 110 }    // #7A786E
const SURFACE = { r: 28, g: 27, b: 24 }     // #1C1B18

export async function exportPdf(element: HTMLElement, filename: string): Promise<void> {
  await document.fonts.ready

  // ── 1. Measure section boundaries (before canvas render) ──────────────────
  const sectionEls = Array.from(element.querySelectorAll('[data-pdf-section]'))
  const elRect = element.getBoundingClientRect()

  const sectionRects = sectionEls.map(el => {
    const r = el.getBoundingClientRect()
    return {
      top: r.top - elRect.top,
      bottom: r.bottom - elRect.top,
      height: r.height,
    }
  })

  // ── 2. Render the full element to a single canvas ─────────────────────────
  const canvas = await html2canvas(element, {
    backgroundColor: '#111110',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const scaleFactor = canvas.width / element.offsetWidth
  const pxPerMm = canvas.width / A4_W_MM
  const pageHPx = A4_H_MM * pxPerMm

  // Convert section rects to canvas-pixel space
  const sectPx = sectionRects.map(s => ({
    top: Math.round(s.top * scaleFactor),
    bottom: Math.round(s.bottom * scaleFactor),
  }))

  // ── 3. Calculate page breaks (greedy, never split a section) ──────────────
  const pageBreaks: number[] = [0] // canvas-px Y where each page starts

  for (const sect of sectPx) {
    const pageStart = pageBreaks[pageBreaks.length - 1]

    // Would this section's bottom exceed the current page?
    if (sect.bottom > pageStart + pageHPx) {
      // Start a new page at this section's top (if it isn't already the start)
      if (sect.top > pageStart) {
        pageBreaks.push(sect.top)
      }
      // If the section itself is taller than a page, allow it to span
      // (rare edge case — very tall calendar overview)
      let cursor = pageBreaks[pageBreaks.length - 1]
      while (sect.bottom > cursor + pageHPx) {
        cursor += pageHPx
        pageBreaks.push(cursor)
      }
    }
  }

  // ── 4. Build PDF pages ────────────────────────────────────────────────────
  const pdf = new jsPDF('p', 'mm', 'a4')

  for (let i = 0; i < pageBreaks.length; i++) {
    if (i > 0) pdf.addPage()

    const startPx = pageBreaks[i]
    const endPx = i + 1 < pageBreaks.length ? pageBreaks[i + 1] : canvas.height
    const sliceH = endPx - startPx
    const sliceHMm = sliceH / pxPerMm

    // Fill entire page with background color (fixes white-blank issue)
    pdf.setFillColor(BG.r, BG.g, BG.b)
    pdf.rect(0, 0, A4_W_MM, A4_H_MM, 'F')

    // Slice the canvas strip for this page
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = Math.ceil(sliceH)
    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, startPx, canvas.width, sliceH, 0, 0, canvas.width, Math.ceil(sliceH))

    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, A4_W_MM, sliceHMm)

    // Draw decorative art in the remaining gap
    const gapMm = A4_H_MM - sliceHMm
    if (gapMm > 12) {
      drawPageDecor(pdf, sliceHMm, i === pageBreaks.length - 1)
    }
  }

  pdf.save(filename)
}

// ─── Decorative filler art (running-themed) ─────────────────────────────────

function drawPageDecor(pdf: jsPDF, contentEndMm: number, isLastPage: boolean) {
  const cX = A4_W_MM / 2
  const startY = contentEndMm + 6
  const endY = A4_H_MM - 6
  const availH = endY - startY

  if (availH < 8) return

  // ── Dotted track path ─────────────────────────────────────────────────────
  const trackY = startY + Math.min(availH * 0.3, 18)
  pdf.setFillColor(BORDER.r, BORDER.g, BORDER.b)
  for (let x = 28; x < A4_W_MM - 28; x += 5) {
    pdf.circle(x, trackY, 0.35, 'F')
  }

  // ── Forward-motion chevrons ›››  ──────────────────────────────────────────
  if (availH > 22) {
    const chevY = startY + Math.min(availH * 0.45, 32)
    pdf.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
    pdf.setLineWidth(0.25)
    const count = 7
    const spacing = 16
    const totalW = (count - 1) * spacing
    const baseX = cX - totalW / 2
    for (let i = 0; i < count; i++) {
      const cx = baseX + i * spacing
      const size = 2.5
      // Draw a ">" chevron
      pdf.line(cx, chevY - size, cx + size, chevY)
      pdf.line(cx + size, chevY, cx, chevY + size)
    }
  }

  // ── Running shoe prints (alternating left/right) ──────────────────────────
  if (availH > 40) {
    const fpY = startY + Math.min(availH * 0.6, 50)
    pdf.setFillColor(SURFACE.r, SURFACE.g, SURFACE.b)
    const prints = 8
    const fpSpacing = 18
    const fpTotalW = (prints - 1) * fpSpacing
    const fpBaseX = cX - fpTotalW / 2
    for (let i = 0; i < prints; i++) {
      const fx = fpBaseX + i * fpSpacing
      const fy = fpY + (i % 2 === 0 ? -2 : 2)
      // Shoe body (ellipse)
      pdf.ellipse(fx, fy, 1.6, 2.8, 'F')
      // Toe
      pdf.circle(fx + 0.6, fy - 3.2, 0.7, 'F')
    }
  }

  // ── Heartbeat / ECG line ──────────────────────────────────────────────────
  if (availH > 60) {
    const ecgY = startY + Math.min(availH * 0.75, 68)
    pdf.setDrawColor(SURFACE.r + 10, SURFACE.g + 10, SURFACE.b + 8)
    pdf.setLineWidth(0.3)

    // Flat → spike → flat pattern repeated
    const segW = 20
    const repeats = Math.floor((A4_W_MM - 60) / segW)
    let sx = cX - (repeats * segW) / 2

    for (let r = 0; r < repeats; r++) {
      const x0 = sx + r * segW
      // Flat
      pdf.line(x0, ecgY, x0 + 6, ecgY)
      // Small dip
      pdf.line(x0 + 6, ecgY, x0 + 7.5, ecgY + 1.5)
      // Spike up
      pdf.line(x0 + 7.5, ecgY + 1.5, x0 + 10, ecgY - 4)
      // Spike down
      pdf.line(x0 + 10, ecgY - 4, x0 + 12.5, ecgY + 2)
      // Return
      pdf.line(x0 + 12.5, ecgY + 2, x0 + 14, ecgY)
      // Flat tail
      pdf.line(x0 + 14, ecgY, x0 + segW, ecgY)
    }
  }

  // ── Abstract runner silhouette (simple stick figure in stride) ─────────────
  if (availH > 85) {
    drawRunnerSilhouette(pdf, cX, startY + Math.min(availH * 0.88, 90))
  }

  // ── STRIDE watermark (last page, or any page with large gap) ──────────────
  if (isLastPage || availH > 100) {
    const brandY = endY - 8
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.setTextColor(EMBER.r, EMBER.g, EMBER.b)
    const strideText = 'S  T  R  I  D  E'
    pdf.text(strideText, cX, brandY, { align: 'center' })

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    pdf.text('Your personalized training plan', cX, brandY + 4.5, { align: 'center' })
  }
}

/**
 * Draw an abstract stick-figure runner mid-stride.
 * Composed entirely of jsPDF lines and circles.
 */
function drawRunnerSilhouette(pdf: jsPDF, cx: number, cy: number) {
  pdf.setDrawColor(BORDER.r + 8, BORDER.g + 8, BORDER.b + 6)
  pdf.setLineWidth(0.4)

  const s = 1.3 // scale factor

  // Head
  pdf.circle(cx + 1 * s, cy - 12 * s, 1.8 * s, 'S')

  // Torso (leaning forward)
  pdf.line(cx + 1 * s, cy - 10 * s, cx - 2 * s, cy - 2 * s)

  // Front arm (reaching forward)
  pdf.line(cx - 0.5 * s, cy - 7 * s, cx + 5 * s, cy - 6 * s)
  // Back arm (reaching back)
  pdf.line(cx - 0.5 * s, cy - 7 * s, cx - 6 * s, cy - 4 * s)

  // Front leg (extended forward)
  pdf.line(cx - 2 * s, cy - 2 * s, cx + 4 * s, cy + 1 * s)
  pdf.line(cx + 4 * s, cy + 1 * s, cx + 6 * s, cy - 0.5 * s) // foot

  // Back leg (pushing off behind)
  pdf.line(cx - 2 * s, cy - 2 * s, cx - 7 * s, cy + 2 * s)
  pdf.line(cx - 7 * s, cy + 2 * s, cx - 9 * s, cy + 1 * s) // foot
}
