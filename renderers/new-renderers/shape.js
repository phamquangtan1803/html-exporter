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
    alpha = 0,
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
    elementType,
    rotation,
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
  } = json;

  const svgSrc = svgElement.svgString
    ? await changeSvgColor(stretchySvg(svgElement.svgString), fill)
    : "";
  const imgSrc = src;
  const shapeType = svgElement.children?.[0].type;

  console.log("svgElement", svgElement);

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
  const calculatedCropY =
    shapeType === "ellipse" ? 0.5 + cropY - 0.5 * cropHeight : cropY;
  const calculatedCropX =
    shapeType === "ellipse" ? 0.5 + cropX - 0.5 * cropWidth : cropX;

  const shapeStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 0,
    "object-fit": "fill",
  };

  const imgContainerStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "border-radius": `${radius}`,
    "z-index": 1,
    "mask-image": `url(${svgSrc})`,
  };

  const imgStyle = {
    width: `${(100 / (100 * cropWidth)) * 100}%`,
    height: `${(100 / (100 * cropHeight)) * 100}%`,
    top: `-${(100 / (100 * cropHeight)) * calculatedCropY * 100}%`,
    left: `-${(100 / (100 * cropWidth)) * calculatedCropX * 100}%`,
    position: "absolute",
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
    filter: `drop-shadow(${shadow})`,
    opacity: `${opacity}`,
  };

  const cssContainerStyle = cssify(containerStyle);
  const cssShapeStyle = cssify(shapeStyle);
  const cssImgStyle = cssify(imgStyle);
  const cssImgContainerStyle = cssify(imgContainerStyle);
  const cssBorderStyle = cssify(borderStyle);
  const cssOverlayStyle = cssify(overlayStyle);

  return `<div style="${cssContainerStyle}">
            <img style="${cssShapeStyle}" src="${svgSrc}"/>
            ${
              imgSrc &&
              `<div style="${cssImgContainerStyle}">
              <img style="${cssImgStyle}" src="${imgSrc}" />
            </div>`
            }
            <div style="${cssBorderStyle}"></div>
            <div style="${cssOverlayStyle}"></div>
        </div>`;
};
