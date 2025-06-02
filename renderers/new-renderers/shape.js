import {
  changeSvgColor,
  convertHexToRgba,
  cssify,
  stretchySvg,
} from "./base.js";

export const shapeJsonToHtml = async (json) => {
  const {
    svgElement,
    fill,
    stroke,
    strokeWidth,
    cornerRadiusTopLeft,
    cornerRadiusTopRight,
    cornerRadiusBottomLeft,
    cornerRadiusBottomRight,
    alpha,
    overlayFill,
    gradient,
    shadowColor,
    shadowBlur,
    shadowOpacity,
    shadowOffsetX,
    shadowOffsetY,
    opacity,
    src,
    cropWidth,
    cropHeight,
    cropX,
    cropY,
    imageWidth,
    imageHeight,
    shadowEnabled,
  } = json;

  const svgSrc = changeSvgColor(stretchySvg(svgElement.svgString), fill);
  const imgSrc = src;

  console.log("strecthySvg", stretchySvg(svgElement.svgString));

  console.log("svgElement", svgElement);

  const shadow =
    shadowEnabled && shadowColor !== "undefined"
      ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${convertHexToRgba(
          shadowColor,
          shadowOpacity
        )}`
      : "none";

  const radius = `${cornerRadiusTopLeft}px 
                      ${cornerRadiusTopRight}px 
                      ${cornerRadiusBottomRight}px 
                      ${cornerRadiusBottomLeft}px`;

  const imgStyle = {
    position: "absolute",
    width: `${(100 / (100 * cropWidth)) * 100}%`,
    height: `${(100 / (100 * cropHeight)) * 100}%`,
    top: `${-(100 / (100 * cropHeight)) * cropY * 100}%`,
    left: `${-(100 / (100 * cropWidth)) * cropX * 100}%`,
    "border-radius": `${radius}`,
    "z-index": 1,
  };

  const borderStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 2,
    border: `${strokeWidth}px solid ${stroke}`,
  };

  const overlayStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 3,
    "background-color": `${convertHexToRgba(
      overlayFill || "#fff",
      overlayFill ? alpha : 0
    )}`,
    "border-radius": `${radius}`,
  };

  const containerStyle = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    "border-radius": `${radius}`,
    "box-shadow": `${shadow}`,
    opacity: `${opacity}`,
    "mask-image": `url(${svgSrc})`,
    "background-color": `${fill}`,
  };

  const cssContainerStyle = cssify(containerStyle);
  const cssImgStyle = cssify(imgStyle);
  const cssBorderStyle = cssify(borderStyle);
  const cssOverlayStyle = cssify(overlayStyle);

  return `<div style="${cssContainerStyle}">
            ${imgSrc && `<img style="${cssImgStyle}" src="${imgSrc}"/>`}
            <div style="${cssBorderStyle}"></div>
            <div style="${cssOverlayStyle}"></div>
        </div>`;
};
