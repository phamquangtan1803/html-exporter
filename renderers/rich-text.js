import { cssify } from "./css-utils.js";
import { renderTextDecoration } from "./text-decoration.js";

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
    return `<span style="${fallbackTextStyle}">${fallbackText.replace(
      /\n/g,
      "<br />"
    )}</span>`;
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

      const calculatedAdjust = line.words
        .map((word) => word.chars.flat())
        .flat()
        .map((char, index, arr) => {
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

  return result;
};
