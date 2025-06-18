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

  const promises = children.map(async (child) => {
    const {
      id,
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
      groupChildren = [],
    } = child;

    let calculated = {
      rotation: rotation,
      transformOrigin: "top left",
      width: width,
      height: height,
    };

    if (elementType === "line_outline" || elementType === "line") {
      calculated.rotation = getLineRotation(child.points);
      calculated.transformOrigin = `left ${child.strokeWidth / 2}px`;
      calculated.width =
        type === "text"
          ? width
          : width + padding.horizontal * 2 + strokeBgWidth * 2;
      calculated.height =
        type === "text"
          ? height
          : height + padding.vertical * 2 + strokeBgWidth * 2;
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

    let html = "";
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

    htmlElements.push({
      id,
      html,
      x,
      y,
      width: calculated.width,
      height: calculated.height,
      rotation: calculated.rotation,
      transformOrigin: calculated.transformOrigin,
      padding,
      strokeBgWidth: strokeBgWidth / 2,
      index: index,
      groupChildren,
    });
  });

  await Promise.all(promises);
  return htmlElements;
}

export const joinGroupElement = (elementList) => {
  const groupList = [];
  const listElementInGroup = [];

  elementList.forEach((element) => {
    if (element.type === "group") {
      listElementInGroup.push(...element.elementIds);

      const groupChildren = element.elementIds.map((id) => {
        const children = elementList.filter((item) => item.id === id)[0];
        return children;
      });
      groupList.push({ ...element, groupChildren: groupChildren });
    }
  });

  const newElementList = elementList
    .filter((element) => !listElementInGroup.includes(element.id))
    .filter((element) => element.type != "group");
  newElementList.push(...groupList);

  return newElementList;
};

export async function generateChildrenHtml(children) {
  const groupedChildren = joinGroupElement(children);
  const htmlElements = await convertChildrenToHtml(groupedChildren);

  htmlElements.sort((a, b) => a.index - b.index);

  const elementsHtml = await Promise.all(
    htmlElements.map(
      async ({
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
        groupChildren = [],
      }) => `
      <div style="
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${width}px;
        height: ${height}px;
        z-index: ${index};
        rotate: ${rotation}deg;
        transform-origin: ${transformOrigin}; 
        display: flex;
        box-sizing: content-box;
      ">
        ${html || (await generateChildrenHtml(groupChildren))}
      </div>
    `
    )
  );

  return elementsHtml.join("");
}

export async function generateLayoutHtml({ isExporting = false, page }) {
  const { children, width, height, background } = page;
  const baseStyle = getResetCSS();

  console.log("length of children", children.length);

  const elementsHtml = await generateChildrenHtml(children);

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
    .concat(
      children
        .filter((child) => child.type === "text" && child.richTextArr)
        .map((child) => child.richTextArr)
        .filter((line) => line?.length > 0)
        .flat()
        .map((line) => line.words)
        .filter((word) => word?.length > 0)
        .flat()
        .map((word) => word.chars)
        .flat()
        .filter((char) => char.fontFamily && char.s3FilePath)
    )
    .concat(
      children
        .filter(
          (child) =>
            child.valueList &&
            child.valueList.length > 0 &&
            child.type === "text"
        )
        .map((child) => child.valueList)
        .flat()
        .filter((value) => value.fontFamily && value.s3FilePath)
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
