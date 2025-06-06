import { changeSvgColorFromSrc, convertHexToRgba, cssify } from "./base.js";

export const imageJsonToHtml = async (json) => {
  console.log("Image JSON:", json);
  const {
    src,
    imageWidth,
    imageHeight,
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
    shadowEnabled = false,
    shadowColor = "rgba(0, 0, 0, 0.5)",
    shadowBlur = 0,
    shadowOpacity = 1,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    opacity = 1,
    rotation = 0,
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
  const shadow =
    shadowEnabled && shadowColor !== "undefined"
      ? `${adjustedShadowOffsetX}px ${adjustedShadowOffsetY}px ${
          shadowBlur / 2
        }px ${convertHexToRgba(shadowColor, shadowOpacity)}`
      : "none";
  const radius = `${cornerRadiusTopLeft}px 
                  ${cornerRadiusTopRight}px 
                  ${cornerRadiusBottomRight}px 
                  ${cornerRadiusBottomLeft}px`;

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
    "background-color": `${convertHexToRgba(
      overlayFill || "#fff",
      overlayFill ? alpha : 0
    )}`,
  };

  const borderOverlayStyle = {
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
  const cssImageOverlayStyle = cssify(imageOverlayStyle);
  const cssBorderOverlayStyle = cssify(borderOverlayStyle);

  const cssContainerStyle = cssify(containerStyle);

  return `<div style="${cssContainerStyle}">
          <div style="${cssImageContainerStyle}">
            <img style="${cssImageStyle}" 
                  src="${imgSrc}" />
          </div>
            <div style="${cssImageOverlayStyle}"></div>
            <div style="${cssBorderOverlayStyle}"></div>
          </div>`;
};
