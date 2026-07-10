import { changeSvgColorFromSrc } from "./svg-utils.js";
import { cssify } from "./css-utils.js";
import { getOverlayElement } from "./overlay.js";
import { buildShadowString } from "../utils/shadow.js";
import { buildRadiusString } from "../utils/border-radius.js";

export const imageJsonToHtml = async (json) => {
  const {
    src,
    cropHeight,
    cropWidth,
    cropX,
    cropY,
    flipHorizontal,
    flipVertical,
    fill = "transparent",
    stroke = "transparent",
    strokeWidth = 0,
    cornerRadiusTopLeft = 0,
    cornerRadiusTopRight = 0,
    cornerRadiusBottomRight = 0,
    cornerRadiusBottomLeft = 0,
    alpha = 0,
    overlayFill,
    gradient,
    opacity = 1,
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
  } = json;

  const imgSrc = src.endsWith(".svg")
    ? await changeSvgColorFromSrc(src, fill)
    : src;
  const flipTransform = flipHorizontal ? "scaleX(-1)" : "";
  const flipVerticalTransform = flipVertical ? "scaleY(-1)" : "";
  const transform =
    flipTransform || flipVerticalTransform
      ? `${flipTransform} ${flipVerticalTransform}`
      : "none";
  const shadow = buildShadowString({
    shadowEnabled: json.shadowEnabled,
    shadowColor: json.shadowColor,
    shadowBlur: json.shadowBlur,
    shadowOpacity: json.shadowOpacity,
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
  });
  const radius = buildRadiusString(
    cornerRadiusTopLeft,
    cornerRadiusTopRight,
    cornerRadiusBottomRight,
    cornerRadiusBottomLeft
  );

  const calculatedBackgroundColor = src.endsWith(".svg") ? "none" : fill;

  const imageContainerStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 1,
    "border-radius": `${radius}`,
    overflow: "hidden",
    filter: `drop-shadow(${shadow})`,
  };

  const imageStyle = {
    position: "relative",
    width: `${(100 / (100 * cropWidth)) * 100}%`,
    height: `${(100 / (100 * cropHeight)) * 100}%`,
    top: `-${(100 / (100 * cropHeight)) * cropY * 100}%`,
    left: `-${(100 / (100 * cropWidth)) * cropX * 100}%`,
    transform: transform,
    "background-color": `${calculatedBackgroundColor}`,
  };

  const imageOverlayStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 2,
    "border-radius": `${radius}`,
  };

  const imageStrokeStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 3,
    "border-radius": `${radius}`,
    border: `${strokeWidth}px solid ${stroke}`,
  };

  const containerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
    "border-radius": `${radius}`,
    opacity: `${opacity}`,
  };

  const cssImageStyle = cssify(imageStyle);
  const cssImageContainerStyle = cssify(imageContainerStyle);
  const cssImageStrokeStyle = cssify(imageStrokeStyle);
  const cssContainerStyle = cssify(containerStyle);

  return `<div style="${cssContainerStyle}">
            <div style="${cssImageContainerStyle}">
              <img style="${cssImageStyle}"
                    src="${imgSrc}" />
            </div>
            ${getOverlayElement(
              gradient,
              imageOverlayStyle,
              overlayFill,
              alpha
            )}
            <div style="${cssImageStrokeStyle}"></div>
          </div>`;
};
