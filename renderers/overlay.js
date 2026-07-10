import { convertHexToRgba } from "../utils/color.js";
import { cssify } from "./css-utils.js";

export const getOverlayElement = (
  gradientJson,
  style,
  fallbackOverlayFill,
  fallbackAlpha
) => {
  if (!gradientJson) {
    const fallbackStyle = {
      "background-color": `${convertHexToRgba(
        fallbackOverlayFill || "#fff",
        fallbackOverlayFill ? fallbackAlpha : 0
      )}`,
      ...style,
    };
    return `<div style="${cssify(fallbackStyle)}"></div>`;
  }

  const { configs = [], opacity = 0, rotation = 0 } = gradientJson;

  const overlayColorStops =
    `${rotation + 90}deg` +
    configs.reduce(
      (acc, config) => (acc += `, ${config.color} ${config.offset * 100}%`),
      ""
    );

  const overlayStyle = {
    background: `linear-gradient(${overlayColorStops})`,
    opacity: opacity,
    ...style,
  };

  const cssOverlayStyle = cssify(overlayStyle);
  return `<div style="${cssOverlayStyle}"></div>`;
};
