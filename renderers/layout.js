import { STAR_RATING_ELEMENT } from "./constant.js";
import { prefetchFonts } from "./new-renderers/base.js";
import { imageJsonToHtml } from "./new-renderers/image.js";
import { getLineRotation, lineJsonToHtml } from "./new-renderers/line.js";
import { logoJsonToHtml } from "./new-renderers/logo.js";
import { shapeJsonToHtml } from "./new-renderers/shape.js";
import { starSvgJsonToHtml } from "./new-renderers/star.js";
import { textJsonToHtml } from "./new-renderers/text.js";

function getResetCSS() {
  return `
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      body {
          margin: 0;
          padding: 0;
          width: 100% !important;
          height: 100% !important;
      }
      img {
          display: block;
      }
      a {
          color: inherit;
          text-decoration: none;
      }
      p {
          margin: 0;
          padding: 0;
      }
    </style>
  `;
}

async function convertChildrenToHtml(children) {
  const htmlElements = [];

  console.log("Converting children to HTML...", children);

  const promises = children.map(async (child) => {
    const {
      elementType,
      type,
      x = 0,
      y = 0,
      width = 100,
      height = 100,
      rotation = 0,
      padding = { vertical: 0, horizontal: 0 },
      strokeBgWidth = 0,
      index = 0,
      shadowEnabled = false,
      shadowOffsetX = 0,
      shadowOffsetY = 0,
    } = child;

    let calculated = {
      rotation: rotation,
      transformOrigin: "top left",
    };

    if (elementType === "line_outline" || elementType === "line") {
      calculated.rotation = getLineRotation(child.points);
      calculated.transformOrigin = `left ${child.strokeWidth / 2}px`;
    }

    let adjustedShadowOffsetX = shadowOffsetX;
    let adjustedShadowOffsetY = shadowOffsetY;
    if (shadowEnabled && calculated.rotation !== 0) {
      const angleInRadians = (-calculated.rotation * Math.PI) / 180;
      adjustedShadowOffsetX =
        shadowOffsetX * Math.cos(angleInRadians) -
        shadowOffsetY * Math.sin(angleInRadians);
      adjustedShadowOffsetY =
        shadowOffsetX * Math.sin(angleInRadians) +
        shadowOffsetY * Math.cos(angleInRadians);
    }

    let html = `<div></div>`;
    child = {
      ...child,
      strokeBgWidth: strokeBgWidth / 2,
      adjustedShadowOffsetX,
      adjustedShadowOffsetY,
    };

    if (type === "text") {
      html = textJsonToHtml(child);
    } else {
      switch (elementType) {
        case "logo":
          html = await logoJsonToHtml(child);
          break;
        case "line_outline":
        case "line":
          html = lineJsonToHtml(child);
          break;
        case "star_rating":
          html = starSvgJsonToHtml(STAR_RATING_ELEMENT, child);
          break;
        case "graphicShape":
          html = await shapeJsonToHtml(child);
          break;
        case "image":
        case "svg":
        case "complex_svg":
          html = await imageJsonToHtml(child);
          break;
        default:
          break;
      }
    }

    // if (type === "text") {
    //   html = convertTextJsonToHtml(child, rootCoordinates);
    // } else {
    //   switch (elementType) {
    //     case "logo":
    //       html = await convertLogoJsonToHtml(child, rootCoordinates);
    //       break;
    //     case "line_outline":
    //     case "line":
    //       html = await convertLineJsonToHtml(child, rootCoordinates);
    //       break;
    //     case "star_rating":
    //       html = await convertStarRatingJsonToHtml(child, rootCoordinates);
    //       break;
    //     case "graphicShape":
    //     case "complex_svg":
    //       html = await convertShapeJsonToHtml(child, rootCoordinates);
    //       break;
    //     case "image":
    //     case "svg":
    //       html = await convertImgJsonToHtml(child, rootCoordinates);
    //       break;
    //     default:
    //       console.warn(`Unknown type or elementType: ${type || elementType}`);
    //   }
    // }

    if (html) {
      htmlElements.push({
        html,
        x,
        y,
        width,
        height,
        rotation: calculated.rotation,
        transformOrigin: calculated.transformOrigin,
        padding,
        strokeBgWidth: strokeBgWidth / 2,
        index: index,
      });
    }
  });

  await Promise.all(promises);
  return htmlElements;
}

export async function generateLayoutHtml({ isExporting = false, page }) {
  const { children, width, height, background } = page;
  const baseStyle = getResetCSS();

  const htmlElements = await convertChildrenToHtml(children);

  htmlElements.sort((a, b) => a.index - b.index);

  const elementsHtml = htmlElements
    .map(
      ({
        x,
        y,
        width,
        height,
        index,
        rotation,
        transformOrigin,
        padding,
        strokeBgWidth,
        html,
      }) => `
      <div style="
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${width + padding.horizontal * 2 + strokeBgWidth * 2}px;
        height: ${height + padding.vertical * 2 + strokeBgWidth * 2}px;
        z-index: ${index};
        rotate: ${rotation}deg;
        transform-origin: ${transformOrigin}; 
        display: flex;
        box-sizing: content-box;
      ">
        ${html}
      </div>
    `
    )
    .join("");

  const html = `
      <div
        style="          
          ${!isExporting ? "height:100%;" : ""}  
          margin: 0 auto; 
          width: ${width}px;
          height: ${height || "auto"}px;
          position: relative;
          overflow: ${isExporting ? "unset" : "hidden"};
          ${background ? `background: ${background};` : "background: #ffffff;"}
          "
      >
        ${elementsHtml}
      </div>
      `;

  const defaultFonts = children
    .filter(
      (child) => child.fontFamily && child.s3FilePath && child.type === "text"
    )
    .reduce((acc, child) => {
      if (!acc.some((font) => font.fontFamily === child.fontFamily)) {
        acc.push({
          fontFamily: child.fontFamily,
          s3FilePath: child.s3FilePath,
        });
      }
      return acc;
    }, []);

  const defaultFontFaces = await Promise.all(
    defaultFonts.map(
      async (font) => `
      @font-face {
        font-family: '${font.fontFamily}';
        src: url('${await prefetchFonts(font.s3FilePath)}') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `
    )
  );

  return `
  <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        ${baseStyle}

        <style>
          ${defaultFontFaces.join(" ")}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>`;
}
