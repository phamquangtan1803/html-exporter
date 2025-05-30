import { convertHexToRgba, cssify } from "./base.js";

export const imageJsonToHtml = (json) => {
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
  } = json;

  const flipTransform = flipHorizontal ? "scaleX(-1)" : "";
  const flipVerticalTransform = flipVertical ? "scaleY(-1)" : "";
  const transform =
    flipTransform || flipVerticalTransform
      ? `${flipTransform} ${flipVerticalTransform}`
      : "none";
  const shadow =
    shadowEnabled && shadowColor !== "undefined"
      ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${convertHexToRgba(
          shadowColor,
          shadowOpacity
        )}`
      : "none";

  const imageStyle = {
    position: "absolute",
    width: `${(100 / (100 * cropWidth)) * 100}%`,
    height: `${(100 / (100 * cropHeight)) * 100}%`,
    top: `-${(100 / (100 * cropHeight)) * cropY * 100}%`,
    left: `-${(100 / (100 * cropWidth)) * cropX * 100}%`,
    transform: transform,
    "background-color": `${fill}`,
    "z-index": 1,
  };

  const imageOverlayStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
    "background-color": `${convertHexToRgba(
      overlayFill || "#fff",
      overlayFill ? alpha : 0
    )}`,
    "border-radius": `${cornerRadiusTopLeft}px 
                      ${cornerRadiusTopRight}px 
                      ${cornerRadiusBottomRight}px 
                      ${cornerRadiusBottomLeft}px`,
    "z-index": 2,
  };

  const borderOverlayStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
    "border-radius": `${cornerRadiusTopLeft}px 
                      ${cornerRadiusTopRight}px 
                      ${cornerRadiusBottomRight}px 
                      ${cornerRadiusBottomLeft}px`,
    border: `${strokeWidth}px solid ${stroke}`,
    "z-index": 3,
  };

  const containerStyle = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    "border-radius": `${cornerRadiusTopLeft}px 
                      ${cornerRadiusTopRight}px 
                      ${cornerRadiusBottomRight}px 
                      ${cornerRadiusBottomLeft}px`,
    "box-shadow": `${shadow}`,
    opacity: `${opacity}`,
  };

  const cssImageStyle = cssify(imageStyle);
  const cssImageOverlayStyle = cssify(imageOverlayStyle);
  const cssBorderOverlayStyle = cssify(borderOverlayStyle);

  const cssContainerStyle = cssify(containerStyle);

  return `<div style="${cssContainerStyle}">
            <img style="${cssImageStyle}" 
                  src="${src}" />
            <div style="${cssImageOverlayStyle}"></div>
            <div style="${cssBorderOverlayStyle}"></div>
          </div>`;
};
