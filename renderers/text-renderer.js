import { convertHexToRgba } from "../utils/color.js";
import { buildShadowString } from "../utils/shadow.js";
import { buildRadiusString } from "../utils/border-radius.js";
import { cssify } from "./css-utils.js";
import { getTextBackground } from "./text-background.js";
import { getRichText } from "./rich-text.js";

export const mapVerticalAlignToFlex = new Map([
  ["top", "start"],
  ["middle", "center"],
  ["bottom", "end"],
]);

export const mapTextTransformToCSS = (textTransform) => {
  switch (textTransform) {
    case "sentenceCase":
      return "uppercase";
    case "uppercase":
      return "uppercase";
    case "titleCase":
      return "capitalize";
    default:
      return "none";
  }
};

export const getTextTransform = (text, textTransform) => {
  switch (textTransform) {
    case "sentenceCase":
      return text
        .split(".")
        .map((sentence) => {
          const firstLetter = sentence.search("[a-zA-Z]");
          return (
            sentence.charAt(firstLetter).toUpperCase() +
            sentence.slice(firstLetter + 1).toLowerCase()
          );
        })
        .join(".");
    case "uppercase":
      return text.toUpperCase();
    case "titleCase":
      return text
        .split(" ")
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    default:
      return text;
  }
};

export const textJsonToHtml = (json) => {
  const {
    textTransform = "none",
    textDecoration = "none",
    textFill = "black",
    fontSize = 16,
    align = "left",
    verticalAlign = "middle",
    letterSpacing = 0,
    lineHeight = "normal",
    cornerRadiusTopLeft = 0,
    cornerRadiusTopRight = 0,
    cornerRadiusBottomRight = 0,
    cornerRadiusBottomLeft = 0,
    padding = { vertical: 0, horizontal: 0 },
    autoFitBackgroundEnabled,
    strokeBgWidth = 0,
    strokeBackground = "transparent",
    fill = "inherit",
    opacity = 1,
    fontFamily = "inherit",
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
    valueList,
    richTextArr,
    width = 0,
    height,
    textArr,
  } = json;

  const background = getTextBackground({
    textArr:
      richTextArr.length > 0
        ? richTextArr
        : textArr.map((line) => {
            return {
              width: line.width,
              height: lineHeight * fontSize,
            };
          }),
    radius: cornerRadiusTopLeft,
    horizontalAlign: align,
    verticalAlign: verticalAlign,
    elementWidth: width,
    elementHeight: height,
    bgFill: autoFitBackgroundEnabled ? "transparent" : fill,
    stroke: autoFitBackgroundEnabled ? "transparent" : strokeBackground,
    strokeWidth: autoFitBackgroundEnabled ? 0 : strokeBgWidth,
    padding: padding,
  });

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

  const topAdjust = (-padding.vertical - strokeBgWidth).toString();
  const leftAdjust = (-padding.horizontal - strokeBgWidth).toString();

  const text = getTextTransform(json.text || "", textTransform);
  const textStyles = {
    border: autoFitBackgroundEnabled
      ? `${strokeBgWidth}px solid ${strokeBackground}`
      : "none",
    "border-radius": autoFitBackgroundEnabled ? `${radius}` : "0px",
  };

  const alignContainerStyles = {
    "text-align": `${align}`,
    width: "100%",
    height: "fit-content",
    textDecoration: `${
      richTextArr?.length > 0 || valueList?.length > 0 ? "none" : textDecoration
    }`,
    color: `${textFill}`,
    "font-size": `${fontSize}px`,
    "letter-spacing": letterSpacing
      ? `${(letterSpacing / 100) * fontSize}px`
      : undefined,
    "line-height": `${lineHeight}`,
    filter: `drop-shadow(${shadow})`,
    "font-family": `'${fontFamily}'`,
  };

  const textContainerStyles = {
    position: "relative",
    display: "flex",
    width: "100%",
    height: "100%",
    top: `${0}px`,
    left: `${0}px`,
    "align-items": `${mapVerticalAlignToFlex.get(verticalAlign)}`,
    opacity: `${opacity}`,
  };

  const bgContainerStyle = {
    position: "absolute",
    top: `${topAdjust}px`,
    left: `${leftAdjust}px`,
    width: `${width + padding.horizontal * 2 + strokeBgWidth * 2}px`,
    height: `${height + padding.vertical * 2 + strokeBgWidth * 2}px`,
    "z-index": -1,
    "background-color": `${autoFitBackgroundEnabled ? fill : "transparent"}`,
    border: autoFitBackgroundEnabled
      ? `${strokeBgWidth}px solid ${strokeBackground}`
      : "none",
    "border-radius": `${radius}`,
  };

  const cssTextStyles = cssify(textStyles);
  const cssAlignContainerStyles = cssify(alignContainerStyles);
  const cssContainerStyles = cssify(textContainerStyles);
  const cssBgContainerStyles = cssify(bgContainerStyle);

  return `<div style="${cssContainerStyles}">
            <div style="${cssBgContainerStyles}">
              ${background}
            </div>
            <div style="${cssAlignContainerStyles}">
              ${getRichText(
                { elementWidth: width, align },
                richTextArr,
                valueList,
                text,
                cssTextStyles
              )}
            </div>
          </div>`;
};
