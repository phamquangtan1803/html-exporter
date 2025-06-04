import { cssify, stretchySvg } from "./base.js";

export const starSvgJsonToHtml = (svgString, json) => {
  const {
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

  const containerStyle = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    opacity: `${opacity}`,
    "object-fit": "fill",
  };

  const cssContainerStyle = cssify(containerStyle);

  return `<div style="${cssContainerStyle}">${svgString}</div>`;
};
