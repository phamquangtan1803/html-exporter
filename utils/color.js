import tinycolor from "tinycolor2";

export function convertHexToRgba(hex, alpha = 1) {
  const color = tinycolor(hex);
  if (!color.isValid()) {
    throw new Error("Invalid hex color");
  }
  const rgba = color.toRgb();
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
}
