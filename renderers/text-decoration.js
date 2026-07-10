import { cssify } from "./css-utils.js";

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
