import { convertHexToRgba } from "../utils/color.js";

import {
  BorderStyleGenerator,
  ElementGenerator,
  StyleGenerator,
} from "./base.js";

const mapFontWeight = (weight) => {
  const weightMap = {
    Light: 300,
    Regular: 400,
    Medium: 500,
    Bold: 700,
    Black: 900,
  };
  return weightMap[weight] || 400;
};

class FontStyleGenerator extends StyleGenerator {
  generate() {
    const {
      fontFamily,
      fontSize = 16,
      fontWeight = "normal",
      fontStyle,
      letterSpacing,
      lineHeight,
      elementType,
    } = this.props;

    const mappingFontFamily = (elementType) => {
      let typeStyle;
      switch (elementType) {
        case "headline":
          typeStyle = this.json.styling.find(
            (item) => item.style === "Headlines"
          );
          break;
        case "subhead":
          typeStyle = this.json.styling.find(
            (item) => item.style === "Subheads"
          );
          break;
        case "body":
          typeStyle = styling.find((item) => item.style === "BodyCopy");
          break;
        default:
          return {
            fontFamily: `'${fontFamily}', sans-serif`,
            fontWeight: fontWeight,
          };
      }
      return {
        fontFamily: `'${fontFamily}', '${typeStyle?.googleFont}', '${typeStyle?.systemFont}', sans-serif`,
        fontWeight: typeStyle?.systemFontWeight || "normal",
      };
    };

    const fontStyles = mappingFontFamily(elementType);

    return {
      fontFamily: fontStyles.fontFamily,
      fontSize: `${fontSize}px`,
      fontWeight: mapFontWeight(fontStyles.fontWeight),
      fontStyle: fontStyle === "italic" ? "italic" : "normal",
      letterSpacing: this.getLetterSpacing(letterSpacing, fontSize),
      lineHeight: lineHeight || 0,
    };
  }

  getLetterSpacing(spacing, fontSize) {
    const percentage = parseFloat(spacing) / 100;
    return `${(fontSize * percentage).toFixed(1)}px`;
  }
}

class LayoutStyleGenerator extends StyleGenerator {
  generate() {
    const { padding = {} } = this.props;

    return {
      boxSizing: "border-box",
      margin: 0,
      padding: `${padding.vertical || 1}px ${padding.horizontal || 1}px`,
      display: "block",
      ...this.getDimensions(),
      ...this.calcMarginDimension(),
    };
  }

  getDimensions() {
    const { width, height, padding = {}, strokeBgWidth } = this.props;

    const totalBorderWidth = (strokeBgWidth || 0) * 2;
    const totalPaddingHorizontal = (padding?.horizontal || 0) * 2;
    const totalPaddingVertical = (padding?.vertical || 0) * 2;

    const calculatedWidth = width + totalBorderWidth + totalPaddingHorizontal;
    const calculatedHeight = height + totalBorderWidth + totalPaddingVertical;

    return {
      width: `${calculatedWidth}px`,
      height: calculatedHeight ? `${calculatedHeight}px` : "auto",
    };
  }
}

class TextStyleGenerator extends StyleGenerator {
  generate() {
    const {
      textFill,
      textDecoration,
      textTransform,
      align = "left",
    } = this.props;
    return {
      color: textFill,
      textDecoration:
        textDecoration === "strike" ? "line-through" : textDecoration || "none",
      textTransform: this.getTextTransform(textTransform),
      textAlign: align,
      ...this.getWhiteSpace(),
    };
  }

  getTextTransform(transform) {
    const transforms = {
      uppercase: "uppercase",
      titleCase: "capitalize",
      default: "none",
    };
    return transforms[transform] || transforms.default;
  }

  getWhiteSpace() {
    return { whiteSpace: "normal" };
    // const { elementType } = this.props;
    // const whiteSpace = elementType === "body" ? "pre-line" : "normal";
    // return {
    //   whiteSpace,
    // };
  }
}

class EffectStyleGenerator extends StyleGenerator {
  generate() {
    return {
      ...this.getShadowEffect(),
      ...this.getOpacityEffect(),
      ...this.getTransformEffect(),
      ...this.getBackgroundEffect(),
    };
  }

  getShadowEffect() {
    const {
      shadowEnabled,
      shadowColor,
      shadowBlur = 0,
      shadowOpacity = 1,
      shadowOffsetX = 0,
      shadowOffsetY = 0,
    } = this.props;

    if (
      !shadowEnabled ||
      !shadowColor ||
      shadowColor === "transparent" ||
      shadowColor === "undefined"
    ) {
      return {};
    }

    return {
      textShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${this.convertHexToRGBA(
        shadowColor,
        shadowOpacity
      )}`,
    };
  }

  getOpacityEffect() {
    const { opacity = 1 } = this.props;
    return { opacity };
  }

  getTransformEffect() {
    const { rotation = 0 } = this.props;

    if (!rotation) return {};

    return {
      transform: `rotate(${rotation}deg)`,
      transformOrigin: "top left",
    };
  }

  getBackgroundEffect() {
    const { fill, elementType } = this.props;

    return {
      backgroundColor: fill,
      ...(elementType === "cta" && {
        cursor: "pointer",
      }),
    };
  }

  convertHexToRGBA(hex, opacity) {
    if (!hex) return "rgba(0, 0, 0, 0)";

    const hexToRgb = hex
      .replace(/^#/, "")
      .match(/.{2}/g)
      ?.map((x) => parseInt(x, 16)) ?? [0, 0, 0];

    return `rgba(${hexToRgb.join(", ")}, ${opacity})`;
  }
}

class TextElementGenerator extends ElementGenerator {
  constructor(json, rootCoordinates) {
    super(json, rootCoordinates, [
      new FontStyleGenerator(json, rootCoordinates),
      new LayoutStyleGenerator(json, rootCoordinates),
      new BorderStyleGenerator(json, rootCoordinates),
      new TextStyleGenerator(json, rootCoordinates),
      new EffectStyleGenerator(json, rootCoordinates),
    ]);
  }

  generateTextNormal(textHtml, text) {
    if (textHtml) {
      return;
    }

    const { fontFamily, fontSize, fontWeight, textFill, lineHeight } =
      this.json;
    return `
          <p style="
            font-family: ${fontFamily}, sans-serif;
            font-size: ${fontSize}px;
            font-weight: ${fontWeight};
            color: ${textFill};
            line-height: ${lineHeight};
          ">
            ${text}
          </p>
        `;
  }

  replaceFontFamily(html, fontFamily) {
    const fontFamilySnakeCase = this.json.fontFamily.replace(/\s+/g, "_");
    const fontFamilyRichText = `font_${fontFamilySnakeCase}_${this.json.fontId}`;
    const replaceFontFamily = html.replaceAll(fontFamilyRichText, fontFamily);

    return replaceFontFamily;
  }

  replaceEmptyParagraphsWithBr(html, fontFamily) {
    const htmlString = this.replaceFontFamily(html, fontFamily);

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const paragraphs = doc.querySelectorAll("p");

    paragraphs.forEach((p) => {
      if (p.innerHTML.trim() === "") {
        p.innerHTML = "<br />";
      }
    });

    return doc.body.innerHTML;
  }

  generateRichText() {
    const containerStyles = {
      ...this.generateStyles(),
    };

    const {
      width,
      height,
      shadowOffsetX,
      shadowOffsetY,
      shadowBlur,
      shadowColor,
      shadowOpacity,
      shadowEnabled,
      textHtml,
      autoFitBackgroundEnabled,
      rotation,
      text,
      strokeBgWidth,
      strokeWidth,
      padding,
      letterSpacing,
      fontSize,
    } = this.json;

    const stroke = strokeBgWidth || strokeWidth;
    const paddingHorizontal = padding?.horizontal * 2 || 0;
    const paddingVertical = padding?.vertical * 2 || 0;

    return `
    <div
      style="
        width: ${width + stroke + paddingHorizontal}px;
        height: ${height + stroke + paddingVertical}px;
        rotate: ${rotation}deg;
        transform-origin: top left;
        ${this.cssify(this.calcMarginDimension())};
      "
    >
      <div  
        style="
            width: ${
              !autoFitBackgroundEnabled
                ? "fit-content"
                : `-webkit-fill-available`
            };
            justify-self: ${containerStyles.textAlign};
            text-align: ${containerStyles.textAlign};
            letter-spacing: ${Math.round((letterSpacing * fontSize) / 100)}px;
            padding: ${
              containerStyles.backgroundColor != "transparent"
                ? containerStyles.padding
                : "0px"
            };
            background-color: ${containerStyles.backgroundColor};
            opacity: ${containerStyles.opacity};
            border-radius: ${containerStyles.borderRadius};
            word-break: break-word;
            box-sizing: content-box;
            border: ${containerStyles.borderWidth}
                    ${containerStyles.borderStyle}
                    ${containerStyles.borderColor};
            text-transform: ${containerStyles.textTransform};
            text-shadow: ${
              shadowEnabled
                ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${convertHexToRgba(
                    shadowColor,
                    shadowOpacity
                  )}`
                : "none"
            };
            "
      >
        ${this.replaceEmptyParagraphsWithBr(
          textHtml || this.generateTextNormal(textHtml, text),
          containerStyles.fontFamily
        )}
      </div>
    </div>
    `;
  }
}

export function convertTextJsonToHtml(json, rootCoordinates) {
  const generator = new TextElementGenerator(json, rootCoordinates);

  return generator.generateRichText();
}
