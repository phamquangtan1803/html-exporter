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
  } = json;

  const shadow =
    shadowEnabled && shadowColor !== "undefined"
      ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${convertHexToRgba(
          shadowColor,
          shadowOpacity
        )}`
      : "none";
  const topAdjust = (-padding.vertical - strokeBgWidth).toString();
  const leftAdjust = (-padding.horizontal - strokeBgWidth).toString();
  console.log("topAdjust", topAdjust, "leftAdjust", leftAdjust);

  const text = getTextTransform(json.text || "", textTransform);
  const textStyles = {
    textDecoration: `${textDecoration}`,
    color: `${textFill}`,
    "font-size": `${fontSize}px`,
    "text-align": `${align}`,
    "align-self": mapVerticalAlignToFlex.get(verticalAlign),
    "letter-spacing": `${letterSpacing}px`,
    "line-height": `${lineHeight}`,
    "border-radius": `${cornerRadiusTopLeft}px 
                      ${cornerRadiusTopRight}px 
                      ${cornerRadiusBottomRight}px 
                      ${cornerRadiusBottomLeft}px`,
    padding: `${padding.vertical}px ${padding.horizontal}px`,
    border: `${strokeBgWidth}px solid ${strokeBackground}`,
    "background-color": `${fill}`,
    "text-shadow": `${shadow}`,
    opacity: `${opacity}`,
    "font-family": `'${fontFamily}'`,
    width: `${
      !autoFitBackgroundEnabled ? "fit-content" : `-webkit-fill-available`
    }`,

    "box-sizing": "content-box",
    position: "relative",
    top: `${topAdjust}px`,
    left: `${leftAdjust}px`,
    width: "fit-content",
    height: "fit-content",
  };

  const cssTextStyles = cssify(textStyles);

  return `<div style="${cssTextStyles}">${text}</div>`;
};
