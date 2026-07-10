import { convertHexToRgba } from "./color.js";

export const buildShadowString = (json) => {
  const {
    shadowEnabled = false,
    shadowColor = "rgba(0, 0, 0, 0.5)",
    shadowBlur = 0,
    shadowOpacity = 1,
    adjustedShadowOffsetX = 0,
    adjustedShadowOffsetY = 0,
  } = json;

  if (!shadowEnabled || shadowColor === "undefined") {
    return "none";
  }

  return `${adjustedShadowOffsetX}px ${adjustedShadowOffsetY}px ${shadowBlur / 2}px ${convertHexToRgba(shadowColor, shadowOpacity)}`;
};
