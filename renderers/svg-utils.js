import { parse, stringify } from "svgson";

export const stretchySvg = (svgContent) => {
  const widthMatch = svgContent.match(/width="([^"]*)"/)?.[0] || "100";
  const heightMatch = svgContent.match(/height="([^"]*)"/)?.[0] || "100";

  svgContent = svgContent.replace(/<svg([^>]*)width="[^"]*"/, "<svg$1");
  svgContent = svgContent.replace(/<svg([^>]*)height="[^"]*"/, "<svg$1");

  if (!svgContent.match(/viewBox="[^"]*"/)) {
    svgContent = svgContent.replace(
      /<svg/,
      `<svg viewBox="0 0 ${widthMatch} ${heightMatch}"`
    );
  }
  if (!svgContent.match(/preserveAspectRatio="[^"]*"/)) {
    svgContent = svgContent.replace(/<svg/, `<svg preserveAspectRatio="none" `);
  }
  return svgContent;
};

export const applyFillColor = (node, fillColor) => {
  if (!node || !node.attributes) {
    return;
  }
  fillColor = fillColor ?? "transparent";

  const transparentColors = new Set([
    "none",
    "transparent",
    "rgba(0,0,0,0)",
    "rgba(255,255,255,0)",
  ]);

  if (node.name === "style" && node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      if (child.type === "text" && child.value) {
        child.value = child.value.replace(
          /\.cls-\d+\s*{[^}]*fill:\s*[^;]+/g,
          (match) => match.replace(/fill:\s*[^;]+/, `fill: ${fillColor}`)
        );
      }
    });
    return;
  }

  const replaceColor = (attr) => {
    if (
      node.attributes[attr] &&
      !transparentColors.has(node.attributes[attr])
    ) {
      node.attributes[attr] = fillColor;
    }
  };

  replaceColor("fill");
  replaceColor("stroke");

  if (node.attributes.style) {
    let style = node.attributes.style;

    if (!style.includes("fill:") && !style.includes("stroke:")) {
      style += `fill: ${fillColor}; stroke: ${fillColor};`;
    } else {
      style = style
        .replace(/fill:\s*([^;]+)/g, (match, color) =>
          transparentColors.has(color.trim().toLowerCase()) ||
          color.startsWith("url(")
            ? match
            : `fill: ${fillColor}`
        )
        .replace(/stroke:\s*([^;]+)/g, (match, color) =>
          transparentColors.has(color.trim().toLowerCase()) ||
          color.startsWith("url(")
            ? match
            : `stroke: ${fillColor}`
        );
    }

    node.attributes.style = style;
  } else {
    node.attributes.fill = fillColor;
    node.attributes.stroke = fillColor;
  }

  if (node.name === "stop" && node.attributes["stop-color"]) {
    if (!transparentColors.has(node.attributes["stop-color"].toLowerCase())) {
      node.attributes["stop-color"] = fillColor;
    }
  }

  if (node.children) {
    node.children.forEach((child) => applyFillColor(child, fillColor));
  }
};

export const changeSvgColor = async (svgContent, fillColor) => {
  svgContent = await parse(svgContent);
  applyFillColor(svgContent, fillColor);
  return `data:image/svg+xml;base64,${btoa(stringify(svgContent))}`;
};

export const changeSvgColorAndStroke = async (
  svgString,
  fillColor,
  strokeColor,
  strokeWidth,
  containerWidth,
  containerHeight,
  svgElement
) => {
  svgString = await parse(svgString);
  applyFillColor(svgString, fillColor);

  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] =
    svgString.attributes.viewBox.split(" ").map(Number);
  const xRatio = viewBoxWidth / containerWidth;
  const yRatio = viewBoxHeight / containerHeight;

  if (strokeColor) {
    svgString.children.forEach((child) => {
      if (child.attributes) {
        child.attributes.stroke = strokeColor;
        child.attributes["stroke-width"] = `${strokeWidth * xRatio}`;
      }
    });
    svgString.attributes.viewBox = `${viewBoxX - (strokeWidth * xRatio) / 2} ${
      viewBoxY - (strokeWidth * yRatio) / 2
    } ${viewBoxWidth + strokeWidth * xRatio} ${
      viewBoxHeight + strokeWidth * yRatio
    }`;
  }
  return `data:image/svg+xml;base64,${btoa(stringify(svgString))}`;
};

export const changeSvgColorFromSrc = async (src, fill) => {
  const response = await fetch(src);
  let svgContent = await response.text();
  return await changeSvgColor(svgContent, fill);
};
