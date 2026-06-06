# PDF Render Audit

**Date:** 06 June 2026
**Target:** Frontend Document Editor & Canvas Rendering Engine

## Audit Findings
The original PDF rendering implementation explicitly mapped `canvas.width` and `canvas.height` to the `viewport` dimensions. However, on high DPI displays (like Retina screens, MacBooks, and modern mobile devices), `window.devicePixelRatio` can be `2` or even `3`.
By failing to account for this pixel density multiplier, the browser stretched a low-resolution canvas across a high-resolution screen, causing text and signature lines to look blurry, fuzzy, and un-professional (especially at 125% and 150% UI scaling).

## Resolution

The `DocumentEditor.tsx` rendering functions (`PdfPage` and `PdfThumbnail`) have been upgraded to support Retina and High-DPI screens natively.

1. **Pixel Density Multiplier:** Both components now dynamically fetch the current `devicePixelRatio` using `const dpr = window.devicePixelRatio || 1;`.
2. **Buffer Upscaling:** The internal buffer resolution of the canvas (`canvas.width` and `canvas.height`) is now multiplied by `dpr`.
3. **CSS Lock:** The visual CSS dimensions are explicitly locked to the standard `viewport.width` and `viewport.height` using `canvas.style.width` and `canvas.style.height`.
4. **Context Scaling:** The 2D rendering context is scaled using `context.scale(dpr, dpr)`, instructing `pdf.js` to draw at the higher native resolution without altering coordinate math.

## Testing Status
✅ Tested at 100% Zoom (Sharp)
✅ Tested at 125% Zoom (Sharp)
✅ Tested at 150% Zoom (Sharp)
✅ Thumbnail sidebar renders sharply without blur
