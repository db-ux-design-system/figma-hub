export function hexToRgba(hex: string) {
  // Use full precision for RGB to avoid rounding errors
  // Figma uses floating point values between 0 and 1
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Round alpha to whole percent (0.00, 0.01, 0.02, ... 1.00)
  // This is needed for Figma's transparency handling
  const a =
    hex.length === 9
      ? Math.round((parseInt(hex.slice(7, 9), 16) / 255) * 100) / 100
      : 1;

  return { r, g, b, a };
}

export function areColorsEqual(c1: any, c2: any) {
  if (!c1 || !c2) return false;
  if (c1.type === "VARIABLE_ALIAS" || c2.type === "VARIABLE_ALIAS")
    return false;
  const tolerance = 0.001;
  return (
    Math.abs(c1.r - c2.r) < tolerance &&
    Math.abs(c1.g - c2.g) < tolerance &&
    Math.abs(c1.b - c2.b) < tolerance &&
    c1.a === c2.a // Exact match for alpha to ensure rounding is applied
  );
}
