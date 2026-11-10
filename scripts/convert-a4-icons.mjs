/**
 * Convert LVGL A4 (4-bit alpha) icons to PNG.
 * Spec: 2 pixels/byte, hi nibble = pixel N, lo = N+1; alpha = nibble * 17.
 * Dimensions from byte length (e.g. 4608 → 96×96).
 * Run after placing .a4 files in public/icons/a4/
 */
console.log("Use scripts/convert_a4_icons.py for conversion.");
