import { convertImgJsonToHtml } from "./image.js";
import { convertLogoJsonToHtml } from "./logo.js";
import { prefetchFonts } from "./new-renderers/base.js";
import { imageJsonToHtml } from "./new-renderers/image.js";
import { logoJsonToHtml } from "./new-renderers/logo.js";
import { textJsonToHtml } from "./new-renderers/text.js";
import {
  convertLineJsonToHtml,
  convertShapeJsonToHtml,
  convertStarRatingJsonToHtml,
} from "./shape.js";
import { convertTextJsonToHtml } from "./text.js";

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
    } = child;

    child = { ...child, strokeBgWidth: strokeBgWidth / 2 };

    let html = `<div></div>`;

    if (type === "text") {
      html = textJsonToHtml(child);
    } else {
      switch (elementType) {
        case "logo":
          html = await logoJsonToHtml(child);
          break;
        case "line_outline":
        case "line":
          break;
        case "star_rating":
          break;
        case "graphicShape":
        case "complex_svg":
          break;
        case "image":
        case "svg":
          html = imageJsonToHtml(child);
          break;
        default:
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
        rotation,
        padding,
        strokeBgWidth: strokeBgWidth / 2,
        index: child.index || 0,
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
        transform-origin: top left; 
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
    .filter((child) => child.fontFamily && child.s3FilePath)
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
