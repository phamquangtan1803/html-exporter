import {
  changeSvgColor,
  convertHexToRgba,
  cssify,
  stretchySvg,
} from "./base.js";

export const shapeJsonToHtml = async (json) => {
  const {
    svgElement,
    fill = "transparent",
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

  const svgSrc = await changeSvgColor(stretchySvg(svgElement.svgString), fill);
  const imgSrc = src;
  const shapeType = svgElement.children[0].type;
  const isRect = shapeType === "rect";
  const isEllipse = shapeType === "ellipse";

  console.log("strecthySvg", stretchySvg(svgElement.svgString));
  console.log("svgElement", svgElement);

  const shadow =
    shadowEnabled && shadowColor !== "undefined"
      ? `${shadowOffsetX}px ${shadowOffsetY}px ${
          shadowBlur / 2
        }px ${convertHexToRgba(shadowColor, shadowOpacity)}`
      : "none";
  const radius = `${cornerRadiusTopLeft}px 
                      ${cornerRadiusTopRight}px 
                      ${cornerRadiusBottomRight}px 
                      ${cornerRadiusBottomLeft}px`;
  const calculatedCropY = isEllipse ? 0.5 + cropY - 0.5 * cropHeight : cropY;
  const calculatedCropX = isEllipse ? 0.5 + cropX - 0.5 * cropWidth : cropX;
  const calculatedBorderStyle = {
    width:
      isRect || isEllipse ? "100%" : `calc(100% + ${strokeWidth * 1.25}px)`,
    height:
      isRect || isEllipse ? "100%" : `calc(100% + ${strokeWidth * 1.25}px)`,
    top: isRect || isEllipse ? "0" : `-${(strokeWidth * 1.25) / 2}px`,
    left: isRect || isEllipse ? "0" : `-${(strokeWidth * 1.25) / 2}px`,
    maskSize:
      isRect || isEllipse
        ? `100% 100%, 
          calc(100% - ${strokeWidth * 2}px) 
          calc(100% - ${strokeWidth * 2}px)`
        : `100% 100%, 
          calc(100% - ${strokeWidth * 2.25}px) 
          calc(100% - ${strokeWidth * 2.25}px)`,
  };

  const calculatedOverlayStyle = {
    zIndex: isRect || isEllipse ? 4 : 2,
    maskImage: isRect ? "none" : `url(${svgSrc})`,
  };

  const shapeStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "border-radius": `${radius}`,
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
    "border-radius": `${radius}`,
  };

  const borderStyle = {
    width: calculatedBorderStyle.width,
    height: calculatedBorderStyle.height,
    top: calculatedBorderStyle.top,
    left: calculatedBorderStyle.left,
    position: "absolute",
    "border-radius": `${radius}`,
    "z-index": 3,
    "background-color": `${stroke}`,
    "mask-image": `url(${svgSrc}), url(${svgSrc})`,
    "mask-size": calculatedBorderStyle.maskSize,
    "mask-position": "center",
    "mask-repeat": "no-repeat",
    "mask-composite": "subtract",
  };

  const overlayStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "border-radius": `${radius}`,
    "z-index": calculatedOverlayStyle.zIndex,
    "background-color": `${convertHexToRgba(
      overlayFill || "#fff",
      overlayFill ? alpha : 0
    )}`,
    "mask-image": calculatedOverlayStyle.maskImage,
  };

  const containerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
    "border-radius": `${radius}`,
    opacity: `${opacity}`,
    filter: `drop-shadow(${shadow})`,
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
