import tinycolor from "tinycolor2";
import { changeSvgColor, cssify, getLogoPaddingValues } from "./base.js";

export const logoJsonToHtml = async (json) => {
  console.log("Logo JSON:", json);
  const {
    src,
    padding: { paddingRight, paddingLeft, paddingTop, paddingBottom },
    fill = "transparent",
    opacity = 1,
    width,
    height,
    logoScale,
    imageWidth,
    imageHeight,
    paddingRatio,
  } = json;

  const { logoWidth, logoHeight } = getLogoPaddingValues(
    { width: imageWidth, height: imageHeight },
    width,
    height,
    paddingRatio,
    { paddingRight, paddingLeft, paddingTop, paddingBottom },
    logoScale
  );
  const justifyContent =
    paddingRight && paddingLeft ? "center" : paddingLeft ? "end" : "start";
  const alignItems =
    paddingTop && paddingBottom ? "center" : paddingTop ? "end" : "start";
  const fillColor =
    fill !== "transparent"
      ? opacity !== 1
        ? tinycolor(fill).setAlpha(opacity).toRgbString()
        : fill
      : "transparent";

  const logoStyle = {
    width: `${logoWidth}px`,
    height: `${logoHeight}px`,
    color: `${fillColor}`,
  };

  const outerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    overflow: "hidden",
    position: "relative",
    "justify-content": justifyContent,
    "align-items": alignItems,
  };

  const logo = await changeSvgColor(src, fillColor);
  const cssLogoStyle = cssify(logoStyle);
  const cssOuterStyle = cssify(outerStyle);

  return `<div style="${cssOuterStyle}">
            <img style="${cssLogoStyle}" src="${logo}" />
          </div>`;
};
