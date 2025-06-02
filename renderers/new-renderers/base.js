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

export const changeSvgColor = (svgContent, fill) => {
  if (fill && fill !== "transparent") {
    svgContent = svgContent.replace(/fill="[^"]*"/g, `fill="${fill}"`);
  }
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

export const changeSvgColorFromSrc = async (src, fill) => {
  const response = await fetch(src);
  let svgContent = await response.text();
  return changeSvgColor(svgContent, fill);
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
