import { convertHexToRgba, cssify, stretchySvg } from "./base.js";

export const starSvgJsonToHtml = (svgString, json) => {
  const {
    id,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    overlayFill,
    alpha,
    opacity,
  } = json;
  if (!svgString) return `<svg width="${width}" height="${height}"></svg>`;

  // Replace fill color
  svgString = svgString.replace(/fill="[^"]*"/g, `fill="${fill ?? "none"}"`);

  // Add stroke if specified
  if (stroke && strokeWidth) {
    svgString = svgString.replace(/stroke="[^"]*"/g, `stroke="${stroke}"`);
    svgString = svgString.replace(
      /stroke-width="[^"]*"/g,
      `stroke-width="${strokeWidth}"`
    );
  }

  console.log("svgString11", svgString);

  svgString = stretchySvg(svgString);

  // Add width and height attributes
  svgString = svgString.replace(
    /<svg/,
    `<svg width="${width}" height="${height}" `
  );

  if (id) {
    svgString = svgString.replace(/<svg/, `<svg id="${id}" `);
  }

  const containerStyle = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    opacity: `${opacity}`,
    "object-fit": "fill",
  };

  const svgStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "z-index": 0,
  };

  const overlayStyle = {
    width: "100%",
    height: "100%",
    position: "absolute",
    "mask-image": `url(${`data:image/svg+xml;base64,${btoa(svgString)}`})`,
    "z-index": 1,
    "background-color": `${convertHexToRgba(
      overlayFill || "#fff",
      overlayFill ? alpha : 0
    )}`,
  };

  const cssContainerStyle = cssify(containerStyle);
  const cssOverlayStyle = cssify(overlayStyle);
  const cssSvgStyle = cssify(svgStyle);

  svgString = svgString.replace(/<svg/, `<svg style="${cssSvgStyle}" `);

  return `<div style="${cssContainerStyle}">
            ${svgString}
            <div style="${cssOverlayStyle}"/></div>
          </div>`;
};
