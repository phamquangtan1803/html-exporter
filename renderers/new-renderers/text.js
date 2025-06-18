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

export const renderTextPath = ({
  richTextArr,
  radius,
  horizontalAlign,
  verticalAlign,
  elementWidth,
  elementHeight,
}) => {
  radius = richTextArr.reduce((acc, line, index) => {
    const minWH = Math.min(
      line.width,
      line.height,
      Math.abs(line.width - (richTextArr[index - 1]?.width ?? 0))
    );
    return Math.min(acc, minWH / 2);
  }, radius || 0);
  const isCenter = horizontalAlign === "center";
  const isStart =
    horizontalAlign === "left" ||
    horizontalAlign === "start" ||
    horizontalAlign === "justify";
  const isEnd = horizontalAlign === "right" || horizontalAlign === "end";

  const maxX = elementWidth - richTextArr?.[0]?.width || 0;
  const maxY =
    elementHeight - richTextArr?.reduce((acc, line) => acc + line.height, 0) ||
    0;
  const startX =
    maxX * (isCenter ? 0.5 : isEnd ? 1 : 0) + radius * (isStart ? 1 : 0);
  const startY =
    maxY *
    (verticalAlign === "middle" ? 0.5 : verticalAlign === "bottom" ? 1 : 0);

  let textBackgroundPath = "";
  textBackgroundPath += `M ${startX} ${startY} \n`;
  textBackgroundPath += `h ${richTextArr[0].width - 2 * radius} \n`;
  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${radius} ${radius} \n`;
  textBackgroundPath += `v ${richTextArr[0].height - 2 * radius} \n`;

  for (let i = 1; i < richTextArr.length; i++) {
    let isLargerThanPrevious = richTextArr[i].width > richTextArr[i - 1].width;
    textBackgroundPath += !isEnd
      ? `a ${radius} ${radius}, 0, 0, ${isLargerThanPrevious ? "0" : "1"}, ${
          radius * (isLargerThanPrevious ? 1 : -1)
        } ${radius} \n`
      : "";
    textBackgroundPath += `h ${
      ((richTextArr[i].width - richTextArr[i - 1].width) *
        (isCenter ? 0.5 : 1) -
        (isLargerThanPrevious ? 1 : -1) * 2 * radius) *
      !isEnd
    }\n`;
    textBackgroundPath += !isEnd
      ? `a ${radius} ${radius}, 0, 0, ${!isLargerThanPrevious ? "0" : "1"}, ${
          radius * (isLargerThanPrevious ? 1 : -1)
        } ${radius} \n`
      : "";
    textBackgroundPath += `v ${richTextArr[i].height - 2 * radius * !isEnd} \n`;
  }

  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${-radius} ${radius} \n`;
  textBackgroundPath += `h ${-(
    richTextArr[richTextArr.length - 1].width -
    2 * radius
  )} \n`;
  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${-radius} ${-radius} \n`;
  textBackgroundPath += `v ${-(
    richTextArr[richTextArr.length - 1].height -
    2 * radius
  )} \n`;

  for (let i = richTextArr.length - 1; i > 0; i--) {
    let isLargerThanPrevious = richTextArr[i].width > richTextArr[i - 1].width;
    textBackgroundPath += !isStart
      ? `a ${radius} ${radius}, 0, 0, ${!isLargerThanPrevious ? "0" : "1"}, ${
          radius * (!isLargerThanPrevious ? -1 : 1)
        } ${-radius} \n`
      : "";
    textBackgroundPath += `h ${
      ((richTextArr[i].width - richTextArr[i - 1].width) *
        (isCenter ? 0.5 : 1) -
        (isLargerThanPrevious ? 1 : -1) * 2 * radius) *
      !isStart
    }\n`;
    textBackgroundPath += !isStart
      ? `a ${radius} ${radius}, 0, 0, ${isLargerThanPrevious ? "0" : "1"}, ${
          radius * (!isLargerThanPrevious ? -1 : 1)
        } ${-radius} \n`
      : "";
    textBackgroundPath += `v ${-(
      richTextArr[i - 1].height -
      2 * radius * !isStart
    )} \n`;
  }

  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${radius} ${-radius} \n`;
  textBackgroundPath += "Z\n";
  return textBackgroundPath;
};

export const getTextBackground = ({
  richTextArr,
  radius,
  horizontalAlign,
  verticalAlign,
  elementWidth,
  elementHeight,
  bgFill = "transparent",
  stroke = "transparent",
  strokeWidth = 0,
}) => {
  const cloneRichText = JSON.parse(JSON.stringify(richTextArr));
  const modifiedRichTextArr = cloneRichText.map((line, index) => {
    return {
      ...line,
      width: line.width + strokeWidth,
      height:
        line.height +
        strokeWidth *
          ((index === 0 ||
          (index !== 0 && cloneRichText[index - 1].width < line.width)
            ? 0.5
            : -0.5) +
            (index === cloneRichText.length - 1 ||
            (index !== cloneRichText.length - 1 &&
              cloneRichText[index + 1].width < line.width)
              ? 0.5
              : -0.5)),
    };
  });
  const renderParams = {
    richTextArr: modifiedRichTextArr,
    radius,
    horizontalAlign,
    verticalAlign,
    elementWidth,
    elementHeight,
    strokeWidth,
  };
  const fillPath = renderTextPath(renderParams);

  return `<svg width="${elementWidth + strokeWidth * 2}" height="${
    elementHeight + strokeWidth * 2
  }" xmlns="http://www.w3.org/2000/svg" viewBox="${-strokeWidth / 2} ${
    -strokeWidth / 2
  } ${elementWidth + strokeWidth * 2} ${elementHeight + strokeWidth * 2}">
    <path d="${fillPath}" fill="${bgFill}" stroke="${stroke}" stroke-width="${strokeWidth}"  />
  </svg>`;
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
          "letter-spacing": letterSpacing
            ? `${(letterSpacing / 100) * fontSize}px`
            : undefined,
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
  elementAttributes,
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
          const htmlChars = chars
            .map(
              ({
                text,
                fill,
                letterSpacing,
                lineHeight,
                fontSize,
                fontFamily,
              }) => {
                const richTextStyles = {
                  color: fill,
                  "letter-spacing": letterSpacing
                    ? `${(letterSpacing / 100) * fontSize}px`
                    : undefined,
                  "line-height": lineHeight ? `${lineHeight}` : undefined,
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
          return htmlChars;
        })
        .join("");

      const largestFontSize = Math.max(
        ...line.words.map((word) =>
          Math.max(...word.chars.map((char) => char.fontSize || 0))
        )
      );

      const firstFontSize = line.words[0]?.chars[0]?.fontSize || 16;

      const calculatedAdjust = line.words
        .map((word) => word.chars.flat())
        .flat()
        .map((char, index, arr) => {
          // console.log("abc", char);
          let adjustedX = arr[index - 1]?.adjustedX ?? 0;
          if (
            index &&
            char.fontSize !== arr[index - 1].fontSize &&
            arr[index + 1]?.fontSize &&
            arr[index + 1]?.fontSize === char.fontSize
          ) {
            adjustedX = adjustedX + -1;
          }
          char.adjustedX = adjustedX;
          return { ...char };
        });

      let adjustIndex = 0;
      const calculatedWords = line.words.map((word) => {
        const calculatedChars = word.chars.map((c) => {
          c.adjustedX = calculatedAdjust[adjustIndex].adjustedX;
          adjustIndex++;
          return c;
        });
        return {
          ...word,
          chars: calculatedChars,
        };
      });

      const htmlDecorations = calculatedWords
        .map((word, wordIndex) => {
          const chars = word.chars;

          const htmlCharsDecoration = chars
            .map(
              ({
                text,
                textDecoration,
                fontSize,
                metrics,
                width,
                adjustedX,
              }) => {
                // calculate for text decoration
                const isSpace = (text = "") => {
                  return `${text}`?.replace(/\u00A0/g, " ") === " ";
                };
                const isAdjustSpace =
                  isSpace(word?.text) &&
                  elementAttributes.align === "justify" &&
                  !line.isBreakLine;
                const isBreakChar = text === "\n";
                const offsetLineHeight = isBreakChar
                  ? 0
                  : line.height -
                    fontSize -
                    (line.fontSize - fontSize) * 0.5 -
                    line.alphabeticBaseline +
                    metrics?.alphabeticBaseline;
                const lineOffsetY = (line.height - line.fontSize) * 0.5 || 0;
                const charY = Math.max(offsetLineHeight - lineOffsetY, 0);
                const totalWordWidth = line.word?.reduce(
                  (total, word) =>
                    total + (!isSpace(word?.text) ? word?.width : 0),
                  0
                );
                const totalSpaceNumber =
                  line.word?.filter((word) => !!isSpace(word?.text))?.length ||
                  1;
                const spacing =
                  (elementAttributes.elementWidth - totalWordWidth) /
                  totalSpaceNumber;
                // --------

                const textDecorationParams = {
                  x: adjustedX,
                  y: 0,
                  textDecoration: textDecoration,
                  fontSize: line.fontSize,
                  width: isAdjustSpace ? spacing : width + 0.25,
                  color: line.color,
                  charFontSize: fontSize,
                  underlineY: line.height - charY,
                  strikeThroughY: (largestFontSize - fontSize) / 4,
                };

                const textDecorationHtml =
                  renderTextDecoration(textDecorationParams);

                return {
                  textUnderlineHtml: textDecorationHtml?.underlineHtml || "",
                  textStrikeThroughHtml:
                    textDecorationHtml?.strikeThroughHtml || "",
                };
              }
            )
            .reduce(
              (acc, { textUnderlineHtml, textStrikeThroughHtml }) => {
                return {
                  textUnderlineHtml: acc.textUnderlineHtml + textUnderlineHtml,
                  textStrikeThroughHtml:
                    acc.textStrikeThroughHtml + textStrikeThroughHtml,
                };
              },
              { textUnderlineHtml: "", textStrikeThroughHtml: "" }
            );

          return htmlCharsDecoration;
        })
        .reduce(
          (acc, { textUnderlineHtml, textStrikeThroughHtml }) => {
            return {
              textUnderlineHtml: acc.textUnderlineHtml + textUnderlineHtml,
              textStrikeThroughHtml:
                acc.textStrikeThroughHtml + textStrikeThroughHtml,
            };
          },
          { textUnderlineHtml: "", textStrikeThroughHtml: "" }
        );

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

      const decorationStyles = {
        position: "absolute",
        width: "100%",
        height: "100%",
        "z-index": 1,
        pointerEvents: "none",
      };

      const containerStyles = {
        position: "relative",
        width: "100%",
        height: "fit-content",
      };

      const cssParagraphStyles = cssify(paragraphStyles);
      const cssDecorationStyles = cssify(decorationStyles);
      const cssContainerStyles = cssify(containerStyles);

      return `<div style="${cssContainerStyles}">
                <div style="${cssDecorationStyles}">
                  ${htmlDecorations.textStrikeThroughHtml}
                </div>
                <div style="${cssDecorationStyles}">
                  ${htmlDecorations.textUnderlineHtml}
                </div>
                <p style="${cssParagraphStyles}">${htmlWords}</p>
              </div>`;
    })
    .join("");

  // console.log(
  //   "richText chars",
  //   richTextArr
  //     .map((line) => line.words)
  //     .filter((word) => word?.length > 0)
  //     .flat()
  //     .map((word) => word.chars)
  //     .flat()
  // );
  return result;
};

export const renderTextDecoration = ({
  x,
  y,
  textDecoration,
  fontSize,
  charFontSize,
  width,
  color,
  underlineY,
  strikeThroughY,
}) => {
  try {
    const shouldUnderline = `${textDecoration}`.includes("underline");
    const shouldStrikeThrough = `${textDecoration}`.includes("line-through");
    const strikeStrokeWidth = Math.ceil(charFontSize / 15);
    const underlineStrokeWidth = Math.ceil(fontSize / 15);
    const underlineContainerStyle = {
      position: "relative",
      top: `${underlineStrokeWidth / 2}px`,
      left: `${x}px`,
      width: `${width}px`,
      height: `${underlineStrokeWidth}px`,
      display: "inline-block",
      "vertical-align": "bottom",
    };
    const strikeThroughContainerStyle = {
      position: "relative",
      top: `${strikeThroughY}px`,
      left: `${x}px`,
      width: `${width}px`,
      height: `${strikeStrokeWidth}px`,
      display: "inline-block",
      "vertical-align": "middle",
    };
    const cssUnderlineContainerStyle = cssify(underlineContainerStyle);
    const cssStrikeThroughContainerStyle = cssify(strikeThroughContainerStyle);

    const underlineDecoration = `<svg style="${cssUnderlineContainerStyle}" 
                                      fill="${color || "#000000"}" 
                                        stroke="${color || "#000000"}" 
                                        xmlns="http://www.w3.org/2000/svg">
                                      <line 
                                        x1="0" 
                                        y1="${underlineStrokeWidth / 2}px" 
                                        x2="${width + 1}" 
                                        y2="${underlineStrokeWidth / 2}px"
                                        stroke-width="${underlineStrokeWidth}px"/>
                                    </svg>`;
    const strikeThroughDecoration = `<svg style="${cssStrikeThroughContainerStyle}"
                                        fill="${color || "#000000"}" 
                                        stroke="${color || "#000000"}" 
                                        xmlns="http://www.w3.org/2000/svg">
                                      <line 
                                        x1="0" 
                                        y1="${strikeStrokeWidth / 2}px" 
                                        x2="${width + 1}" 
                                        y2="${strikeStrokeWidth / 2}px"
                                        stroke-width="${strikeStrokeWidth}px"/>
                                    </svg>`;

    return {
      underlineHtml: shouldUnderline
        ? underlineDecoration
        : `<div style="${cssUnderlineContainerStyle}"></div>`,
      strikeThroughHtml: shouldStrikeThrough
        ? strikeThroughDecoration
        : `<div style="${cssStrikeThroughContainerStyle}"></div>`,
    };
  } catch (error) {
    console.error(">>>> renderTextDecoration: ", error);
    return null;
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
    width = 0,
    height,
  } = json;
  console.log("textJsonToHtml json", json);

  const background = getTextBackground({
    richTextArr,
    radius: cornerRadiusTopLeft,
    horizontalAlign: align,
    verticalAlign: verticalAlign,
    elementWidth: width,
    elementHeight: height,
    bgFill: autoFitBackgroundEnabled ? "transparent" : fill,
    stroke: autoFitBackgroundEnabled ? "transparent" : strokeBackground,
    strokeWidth: autoFitBackgroundEnabled ? 0 : strokeBgWidth,
  });

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
    padding: `${padding.vertical}px ${padding.horizontal}px`,
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
