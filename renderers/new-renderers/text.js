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

export const getRichTextByValueList = (valueList) => {
  return valueList
    .map(
      (
        {
          text,
          fill,
          letterSpacing,
          lineHeight,
          paragraphSpacing,
          textDecoration,
          fontSize,
          fontFamily,
        },
        index,
        arr
      ) => {
        let startParagraph = "";
        let endParagraph = "";
        let thisParagraphSpacing = paragraphSpacing || 0;
        for (let i = index + 1; i < arr.length; i++) {
          if (arr[i].text !== "\n") {
            if (i === arr.length - 1) {
              thisParagraphSpacing = 0;
              break;
            }
            thisParagraphSpacing = Math.max(
              thisParagraphSpacing,
              arr[i].paragraphSpacing || 0
            );
          } else {
            break;
          }
        }
        const paragraphStyles = {
          "margin-bottom": `${thisParagraphSpacing}px`,
        };
        const cssParagraphStyles = cssify(paragraphStyles);
        if (!index) {
          startParagraph = `<p style="${cssParagraphStyles}">`;
        }
        if (text === "\n") {
          endParagraph = `</p><p style="${cssParagraphStyles}">`;
        }
        if (index === arr.length - 1) {
          endParagraph = `</p>`;
        }
        const richTextStyles = {
          color: fill,
          "letter-spacing": letterSpacing ? `${letterSpacing}px` : undefined,
          "line-height": lineHeight ? `${lineHeight}` : undefined,
          "text-decoration": textDecoration ? `${textDecoration}` : undefined,
          "font-size": fontSize ? `${fontSize}px` : undefined,
          "font-family": fontFamily ? `'${fontFamily}'` : undefined,
          "white-space": "pre",
          "text-decoration-color": "black",
        };
        const cssRichTextStyles = cssify(richTextStyles);
        return `${startParagraph}<span style="${cssRichTextStyles}">${text.replace(
          /\n/g,
          "<br />"
        )}</span>${endParagraph}`;
      }
    )
    .join("");
};

export const getRichText = (
  richTextArr,
  fallbackValueList,
  fallbackText,
  fallbackTextStyle
) => {
  if (richTextArr?.length <= 0 && fallbackValueList?.length <= 0) {
    return `<span style="${fallbackTextStyle}">${fallbackText}</span>`;
  }
  if (richTextArr?.length <= 0) {
    return getRichTextByValueList(fallbackValueList);
  }

  const result = richTextArr
    .map((line, index, arr) => {
      const htmlWords = line.words
        .map((word) => {
          const chars = word.chars;
          const htmlChar = chars
            .map(
              ({
                text,
                fill,
                letterSpacing,
                lineHeight,
                textDecoration,
                fontSize,
                fontFamily,
              }) => {
                const richTextStyles = {
                  color: fill,
                  "letter-spacing": letterSpacing
                    ? `${letterSpacing}px`
                    : undefined,
                  "line-height": lineHeight ? `${lineHeight}` : undefined,
                  "text-decoration": textDecoration
                    ? `${textDecoration}`
                    : undefined,
                  "font-size": fontSize ? `${fontSize}px` : undefined,
                  "font-family": fontFamily ? `'${fontFamily}'` : undefined,
                  "white-space": "pre",
                  "text-decoration-color": "black",
                };
                const cssRichTextStyles = cssify(richTextStyles);
                return `<span style="${cssRichTextStyles}">${text.replace(
                  /\n/g,
                  "<br />"
                )}</span>`;
              }
            )
            .join("");
          return htmlChar;
        })
        .join("");

      const paragraphSpacing =
        index < arr.length - 1
          ? line.words.reduce((acc, word) => {
              const chars = word.chars;
              return Math.max(
                acc,
                ...chars.map((char) => char.paragraphSpacing || 0)
              );
            }, 0)
          : 0;

      const paragraphStyles = {
        "margin-bottom": `${paragraphSpacing}px`,
      };

      const cssParagraphStyles = cssify(paragraphStyles);
      return `<p style="${cssParagraphStyles}">${htmlWords}</p>`;
    })
    .join("");

  console.log(
    "richText chars",
    richTextArr
      .map((line) => line.words)
      .filter((word) => word?.length > 0)
      .flat()
      .map((word) => word.chars)
      .flat()
  );
  return result;
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
    valueList,
    richTextArr,
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

  const text = getTextTransform(json.text || "", textTransform);
  const textStyles = {
    border: `${strokeBgWidth}px solid ${strokeBackground}`,
    "border-radius": `${radius}`,
  };

  const alignContainerStyles = {
    "text-align": `${align}`,
    width: "100%",
    height: "fit-content",
    "background-color": `${autoFitBackgroundEnabled ? "transparent" : fill}`,
    textDecoration: `${
      richTextArr?.length > 0 || valueList?.length > 0 ? "none" : textDecoration
    }`,
    color: `${textFill}`,
    "font-size": `${fontSize}px`,
    "letter-spacing": `${letterSpacing}px`,
    "line-height": `${lineHeight}`,
    filter: `drop-shadow(${shadow})`,
    "font-family": `'${fontFamily}'`,
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
    border: `${strokeBgWidth}px solid ${strokeBackground}`,
  };

  const cssTextStyles = cssify(textStyles);
  const cssAlignContainerStyles = cssify(alignContainerStyles);
  const cssContainerStyles = cssify(textContainerStyles);

  return `<div style="${cssContainerStyles}">
            <div style="${cssAlignContainerStyles}">
              ${getRichText(richTextArr, valueList, text, cssTextStyles)}
            </div>
          </div>`;
};
