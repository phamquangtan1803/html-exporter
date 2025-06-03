import { parse, stringify } from "svgson";
import tinycolor from "tinycolor2";

export function convertHexToRgba(hex, alpha = 1) {
  const color = tinycolor(hex);
  if (!color.isValid()) {
    throw new Error("Invalid hex color");
  }
  const rgba = color.toRgb();
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
}

export const stretchySvg = (svgContent) => {
  // Extract width and height values before removing them
  const widthMatch = svgContent.match(/width="([^"]*)"/)?.[0] || "100";
  const heightMatch = svgContent.match(/height="([^"]*)"/)?.[0] || "100";

  // Remove only width and height of svg tag, not the children
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
  if (!fillColor || fillColor === "transparent" || !node || !node.attributes) {
    return;
  }

  const transparentColors = new Set([
    "none",
    "transparent",
    "rgba(0,0,0,0)",
    "rgba(255,255,255,0)",
  ]);

  // Handle CSS style definitions in defs
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

  // Function to replace attribute colors if applicable
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

  // Handle inline style attributes
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
  }

  // Process gradient stops
  if (node.name === "stop" && node.attributes["stop-color"]) {
    if (!transparentColors.has(node.attributes["stop-color"].toLowerCase())) {
      node.attributes["stop-color"] = fillColor;
    }
  }

  // Recursively process ALL children, including defs
  if (node.children) {
    node.children.forEach((child) => applyFillColor(child, fillColor));
  }
};

export const changeSvgColor = async (svgContent, fillColor) => {
  svgContent = await parse(svgContent);
  applyFillColor(svgContent, fillColor);
  return `data:image/svg+xml;base64,${btoa(stringify(svgContent))}`;
};

export const changeSvgColorFromSrc = async (src, fill) => {
  const response = await fetch(src);
  let svgContent = await response.text();
  return await changeSvgColor(svgContent, fill);
};

export const prefetchFonts = async (src) => {
  let blob = await (await fetch(src)).blob();
  let base64 = await blobToBase64(blob);

  return `data:font/truetype;charset=utf-8;base64,${base64}`;
};

function blobToBase64(blob) {
  return new Promise(async (resolve) => {
    var buffer = await blob.arrayBuffer();
    buffer = Buffer.from(buffer);
    return resolve(buffer.toString("base64"));
  });
}

export const kebabCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
};

export const cssify = (styleObject) => {
  return Object.entries(styleObject)
    .filter(([_, value]) => value != null && value !== "")
    .map(([key, value]) => `${kebabCase(key)}: ${value}`)
    .join("; ");
};

export const getLogoPaddingValues = (
  image,
  maxContainerWidth,
  maxContainerHeight,
  paddingRatio,
  paddingOptions,
  scale = 1
) => {
  if (!image || !image.width || !image.height) return;
  let logoWidth = image.width * scale;
  let logoHeight = image.height * scale;
  let padding;
  let containerWidth;
  let containerHeight;

  if (logoWidth === logoHeight) {
    // Square logo logic
    padding = (logoWidth / 2) * paddingRatio;
    containerWidth = logoWidth + padding * 2;
    containerHeight = logoHeight + padding * 2;

    if (containerHeight > maxContainerHeight) {
      const ratio = maxContainerHeight / containerHeight;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth = maxContainerHeight;
      containerHeight = maxContainerHeight;
    }
  } else if (logoWidth > logoHeight) {
    // Wide logo logic
    padding = logoHeight * paddingRatio;
    containerWidth = logoWidth + padding * 2;
    containerHeight = logoHeight + padding * 2;

    if (containerWidth > maxContainerWidth) {
      const ratio = maxContainerWidth / containerWidth;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth = maxContainerWidth;
      containerHeight *= ratio;
    }

    if (containerHeight > maxContainerHeight) {
      const ratio = maxContainerHeight / containerHeight;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth *= ratio;
      containerHeight = maxContainerHeight;
    }
  } else {
    // Tall logo logic
    padding = logoWidth * paddingRatio;
    containerWidth = logoWidth + padding * 2;
    containerHeight = logoHeight + padding * 2;

    if (containerHeight > maxContainerHeight) {
      const ratio = maxContainerHeight / containerHeight;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth *= ratio;
      containerHeight = maxContainerHeight;
    }
  }

  const paddingValue = (containerWidth - logoWidth) / 2;
  let paddingLeftValue = 0;
  let paddingTopValue = 0;
  let paddingRightValue = 0;
  let paddingBottomValue = 0;

  if (paddingOptions) {
    const { paddingRight, paddingLeft, paddingTop, paddingBottom } =
      paddingOptions;
    const isTopLeftCorner = !paddingTop && !paddingLeft;
    const isTopRightCorner = !paddingTop && !paddingRight;
    const isBottomLeftCorner = !paddingBottom && !paddingLeft;
    const isBottomRightCorner = !paddingBottom && !paddingRight;
    const isTopMiddle = !paddingTop && paddingLeft && paddingRight;
    const isBottomMiddle = !paddingBottom && paddingLeft && paddingRight;
    const isLeftMiddle = !paddingLeft && paddingTop && paddingBottom;
    const isRightMiddle = !paddingRight && paddingTop && paddingBottom;
    const isCenter = paddingTop && paddingBottom && paddingLeft && paddingRight;

    if (
      isTopLeftCorner ||
      isBottomLeftCorner ||
      isTopRightCorner ||
      isBottomRightCorner
    ) {
      paddingLeftValue = paddingValue;
      paddingTopValue = paddingValue;
      paddingRightValue = paddingValue;
      paddingBottomValue = paddingValue;
    }

    if (paddingTop) {
      if (isLeftMiddle || isRightMiddle || isCenter) {
        paddingTopValue = Math.max(
          paddingValue,
          (maxContainerHeight - logoHeight) / 2
        );
      } else {
        paddingTopValue = maxContainerHeight - logoHeight;
      }
    } else {
      paddingTopValue = 0;
    }

    if (paddingLeft) {
      if (isTopMiddle || isBottomMiddle || isCenter) {
        paddingLeftValue = Math.max(
          paddingValue,
          (maxContainerWidth - logoWidth) / 2
        );
      } else {
        paddingLeftValue = maxContainerWidth - logoWidth;
      }
    } else {
      paddingLeftValue = 0;
    }

    if (paddingRight) {
      if (isTopMiddle || isBottomMiddle || isCenter) {
        paddingRightValue = Math.max(
          paddingValue,
          (maxContainerWidth - logoWidth) / 2
        );
      } else {
        paddingRightValue = maxContainerWidth - logoWidth;
      }
    } else {
      paddingRightValue = 0;
    }

    if (paddingBottom) {
      if (isLeftMiddle || isRightMiddle || isCenter) {
        paddingBottomValue = Math.max(
          paddingValue,
          (maxContainerHeight - logoHeight) / 2
        );
      } else {
        paddingBottomValue = maxContainerHeight - logoHeight;
      }
    } else {
      paddingBottomValue = 0;
    }
  }

  return {
    logoWidth,
    logoHeight,
    containerWidth,
    containerHeight,
    padding: {
      top: paddingTopValue,
      left: paddingLeftValue,
      right: paddingRightValue,
      bottom: paddingBottomValue,
    },
  };
};
