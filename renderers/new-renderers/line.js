import { convertHexToRgba, cssify } from "./base.js";

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
    shadowEnabled,
    shadowColor,
    shadowBlur,
    shadowOpacity,
    shadowOffsetX,
    shadowOffsetY,
    opacity = 1,
  } = json;

  const shadow =
    shadowEnabled && shadowColor !== "undefined"
      ? `${shadowOffsetX}px ${shadowOffsetY}px ${
          shadowBlur / 2
        }px ${convertHexToRgba(shadowColor, shadowOpacity)}`
      : "none";

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
    "background-color": `${convertHexToRgba(
      overlayFill || "#fff",
      overlayFill ? alpha : 0
    )}`,
  };

  const svgContainerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
  };

  const cssSvgStyle = cssify(svgStyle);
  const cssOverlayStyle = cssify(overlayStyle);
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
            <div style="${cssOverlayStyle}"></div>
        </div>
        `;
};
