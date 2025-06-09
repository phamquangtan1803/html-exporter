import { convertHexToRgba } from "../../utils/color.js";
import { cssify } from "./base.js";

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
  console.log("my Text", json);
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
    shadowEnabled = false,
    shadowColor = "rgba(0, 0, 0, 0.5)",
    shadowBlur = 0,
    shadowOpacity = 1,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    opacity = 1,
    fontFamily = "inherit",
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
  } = json;

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
  const topAdjust = (-padding.vertical - strokeBgWidth).toString();
  const leftAdjust = (-padding.horizontal - strokeBgWidth).toString();
  console.log("topAdjust", topAdjust, "leftAdjust", leftAdjust);

  const text = getTextTransform(json.text || "", textTransform);
  const textStyles = {
    textDecoration: `${textDecoration}`,
    color: `${textFill}`,
    "font-size": `${fontSize}px`,
    "letter-spacing": `${letterSpacing}px`,
    "line-height": `${lineHeight}`,
    filter: `drop-shadow(${shadow})`,
    "font-family": `'${fontFamily}'`,
    border: `${strokeBgWidth}px solid ${strokeBackground}`,
    "border-radius": `${radius}`,
  };

  const alignContainerStyles = {
    "text-align": `${align}`,
    width: "100%",
    height: "fit-content",
    "background-color": `${autoFitBackgroundEnabled ? "transparent" : fill}`,
  };

  const textContainerStyles = {
    position: "relative",
    display: "flex",
    width: "100%",
    height: "100%",
    top: `${topAdjust}px`,
    left: `${leftAdjust}px`,
    "background-color": `${autoFitBackgroundEnabled ? fill : "transparent"}`,
    "border-radius": `${radius}`,
    "align-items": `${mapVerticalAlignToFlex.get(verticalAlign)}`,
    padding: `${padding.vertical}px ${padding.horizontal}px`,
    opacity: `${opacity}`,
  };

  const cssTextStyles = cssify(textStyles);
  const cssAlignContainerStyles = cssify(alignContainerStyles);
  const cssContainerStyles = cssify(textContainerStyles);

  return `<div style="${cssContainerStyles}">
            <div style="${cssAlignContainerStyles}">
              <span style="${cssTextStyles}">${text}</span> 
            </div>
          </div>`;
};
