import { changeSvgColorAndStroke, stretchySvg } from "./svg-utils.js";
import { cssify } from "./css-utils.js";
import { getOverlayElement } from "./overlay.js";
import { buildShadowString } from "../utils/shadow.js";
import { buildRadiusString } from "../utils/border-radius.js";

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
    opacity,
    src,
    cropWidth,
    cropHeight,
    cropX,
    cropY,
    width,
    height,
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
  } = json;

  const svgSrc = svgElement.svgString
    ? await changeSvgColorAndStroke(
        stretchySvg(svgElement.svgString),
        fill,
        stroke,
        strokeWidth,
        width,
        height,
        svgElement
      )
    : "";

  const imgSrc = src;
  const shapeType = svgElement.children?.[0].type;

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
    cornerRadiusBottomLeft,
    cornerRadiusBottomRight
  );

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
  };

  const overlayStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 3,
    "border-radius": `${radius}`,
    "mask-image": `url(${svgSrc})`,
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

  return `<div style="${cssContainerStyle}">
            <img style="${cssShapeStyle}" src="${svgSrc}"/>
            ${
              imgSrc &&
              `<div style="${cssImgContainerStyle}">
              <img style="${cssImgStyle}" src="${imgSrc}" />
            </div>`
            }

            ${getOverlayElement(gradient, overlayStyle, overlayFill, alpha)}
        </div>`;
};
