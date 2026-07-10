import { convertHexToRgba } from "../utils/color.js";
import { cssify } from "./css-utils.js";
import { getOverlayElement } from "./overlay.js";
import { buildShadowString } from "../utils/shadow.js";

export const getLineRotation = (points) => {
  const [x1, y1, x2, y2] = points;
  const vector = [x2 - x1, y2 - y1];
  const radian = Math.atan2(vector[1], vector[0]);
  return radian * (180 / Math.PI);
};

export const lineJsonToHtml = (json) => {
  const {
    stroke,
    strokeWidth,
    points,
    dash,
    alpha,
    overlayFill,
    gradient,
    opacity = 1,
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
  } = json;

  const shadow = buildShadowString({
    shadowEnabled: json.shadowEnabled,
    shadowColor: json.shadowColor,
    shadowBlur: json.shadowBlur,
    shadowOpacity: json.shadowOpacity,
    adjustedShadowOffsetX,
    adjustedShadowOffsetY,
  });

  const [x1, y1, x2, y2] = points;
  const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

  const svgStyle = {
    color: `${convertHexToRgba(stroke, opacity)}`,
    position: "absolute",
    filter: `drop-shadow(${shadow})`,
    "z-index": 0,
  };

  const overlayStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 1,
  };

  const svgContainerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
  };

  const cssSvgStyle = cssify(svgStyle);
  const cssContainerStyle = cssify(svgContainerStyle);
  return `
        <div style="${cssContainerStyle}">
            <svg style="${cssSvgStyle}" fill="currentColor" stroke="currentColor" viewBox="0 0 ${lineLength} ${strokeWidth}" xmlns="http://www.w3.org/2000/svg">
                <line
                    x1="0" y1="${strokeWidth / 2}px"
                    x2="${lineLength}" y2="${strokeWidth / 2}px"
                    stroke-width="${strokeWidth}px"
                    ${dash ? `stroke-dasharray="${dash.join(",")}"` : ""}/>
            </svg>
            ${getOverlayElement(gradient, overlayStyle, overlayFill, alpha)}
        </div>
        `;
};
