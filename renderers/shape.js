import { convertHexToRgba } from "../utils/color.js";

import { ElementGenerator } from "./base.js";
import { STAR_RATING_ELEMENT } from "./constant.js";

class ShapeElementGenerator extends ElementGenerator {
  constructor(json, rootCoordinates) {
    super(json, rootCoordinates, []);
  }

  generateSvgLayer({
    width,
    height,
    svgElement,
    stroke = "transparent",
    strokeWidth = 0,
    id,
    elementType,
    overlayFill = "",
    alpha = 0,
  }) {
    const { viewBoxWidth, viewBoxHeight, svgString } = svgElement;
    const { d } = svgElement.children[0];
    const isPathOrRect = svgString.includes("rect");

    if (isPathOrRect) {
      return this.generateRectSvg(
        width,
        height,
        stroke,
        strokeWidth,
        overlayFill,
        alpha,
        id,
        elementType
      );
    }

    return `
      <svg 
        preserveAspectRatio="none" 
        width="${width}" 
        height="${height}" 
        viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          vector-effect="non-scaling-stroke" 
          stroke-width="${strokeWidth}" 
          stroke="${stroke}" 
          d="${d}" 
          fill="${overlayFill && alpha ? overlayFill : "none"}"
          opacity="${alpha || 1}"
        />
      </svg>
    `;
  }

  generateRectSvg(
    width,
    height,
    stroke,
    strokeWidth,
    fill,
    alpha,
    id,
    elementType
  ) {
    const { svgElement } = this.json;
    const { svgString } = svgElement;
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const rect = svgDoc.querySelector("rect");

    if (rect) {
      const x = rect.getAttribute("x") || "0";
      const y = rect.getAttribute("y") || "0";
      const rectWidth = rect.getAttribute("width") || width;
      const rectHeight = rect.getAttribute("height") || height;

      return `
        <svg 
          preserveAspectRatio="none" 
          width="${width}" 
          height="${height}" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="${x}"
            y="${y}"
            width="${rectWidth}"
            height="${rectHeight}"
            stroke="${stroke}"
            stroke-width="${strokeWidth}"
            fill="${fill || "none"}"
            opacity="${alpha || 1}"
          />
        </svg>
      `;
    }

    return `<svg width="${width}" height="${height}"></svg>`;
  }

  wrapperDiv(svgContent) {
    const {
      opacity,
      shadowOffsetX,
      shadowBlur,
      shadowColor,
      shadowOffsetY,
      shadowOpacity,
      shadowEnabled,
      rotation,
      height,
      width,
      hyperlink,
    } = this.json;

    const shadowStyle = shadowEnabled
      ? `filter: drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${
          shadowBlur / 2
        }px ${convertHexToRgba(shadowColor, shadowOpacity)});`
      : "";

    return `
      <div style="
        opacity: ${opacity};
        width: ${width}px;
        height: ${height}px;
        transform: rotate(${rotation}deg);
        transform-origin: top left;
        ${shadowStyle}
        ${this.cssify(this.calcMarginDimension())};
      ">
        ${this.isHyperLink(hyperlink, svgContent)}
      </div>
    `;
  }

  getMaskSvg() {
    const { width, height, svgElement, src, fill } = this.json;
    let svgString = svgElement?.svgString || "";

    if (!src) {
      svgString = svgString.replace(
        /fill="[^"]*"/g,
        `fill="${fill ?? "none"}"`
      );
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svg = svgDoc.querySelector("svg");

    if (svg) {
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      return svg.outerHTML;
    }

    return `<svg width="${width}" height="${height}"></svg>`;
  }

  getStrokeSvg() {
    const { width, height, svgElement, stroke, strokeWidth, id, elementType } =
      this.json;

    return this.generateSvgLayer({
      width,
      height,
      svgElement,
      stroke,
      strokeWidth,
      id,
      elementType,
    });
  }

  async generateSvgWithBackground() {
    const { width, height, fill, src, gradient, overlayFill, alpha } =
      this.json;

    const maskSvg = this.getMaskSvg();
    const strokeSvg = this.getStrokeSvg();

    // Create a combined SVG with background, mask, and stroke
    let backgroundElements = "";

    // Add solid fill background
    if (fill && fill !== "transparent") {
      backgroundElements += `<rect width="100%" height="100%" fill="${fill}"/>`;
    }

    // Add image background if exists
    if (src) {
      backgroundElements += `
        <image href="${src}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"/>
      `;
    }

    // Add gradient background if exists
    if (gradient && gradient.configs && gradient.opacity > 0) {
      const gradientId = `gradient-${this.json.id}`;
      const angle = gradient.rotation || 0;

      const gradientDef = `
        <defs>
          <linearGradient id="${gradientId}" gradientTransform="rotate(${angle})">
            ${gradient.configs
              .map(
                (config) =>
                  `<stop offset="${config.offset * 100}%" stop-color="${
                    config.color
                  }"/>`
              )
              .join("")}
          </linearGradient>
        </defs>
      `;

      backgroundElements =
        gradientDef +
        backgroundElements +
        `<rect width="100%" height="100%" fill="url(#${gradientId})" opacity="${gradient.opacity}"/>`;
    }

    // Add overlay if exists
    if (overlayFill && alpha) {
      backgroundElements += `<rect width="100%" height="100%" fill="${overlayFill}" opacity="${alpha}"/>`;
    }

    const combinedSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${backgroundElements}
        ${strokeSvg.replace(/<svg[^>]*>|<\/svg>/g, "")}
      </svg>
    `;

    return combinedSvg;
  }

  async generate() {
    const svgContent = await this.generateSvgWithBackground();
    return this.wrapperDiv(svgContent);
  }
}

class LineElementGenerator extends ShapeElementGenerator {
  constructor(json, rootCoordinates) {
    super(json, rootCoordinates);
  }

  createSvgLine() {
    const { points, stroke, strokeWidth, dash, width, height } = this.json;
    let [x1, y1, x2, y2] = points;

    const svgHeight = Math.max(Math.abs(y1), Math.abs(y2)) + strokeWidth;

    return `
      <svg width="${width}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <line 
          x1="${x1}" 
          y1="${Math.abs(Math.min(y1, y2)) + strokeWidth / 2}" 
          x2="${x2}" 
          y2="${Math.max(y1, y2) + strokeWidth / 2}"
          stroke="${stroke}"
          stroke-width="${strokeWidth}"
          ${dash ? `stroke-dasharray="${dash.join(",")}"` : ""}
        />
      </svg>
    `;
  }

  async generate() {
    const svgContent = this.createSvgLine();
    return this.wrapperDiv(svgContent);
  }
}

export class StarRatingGenerator extends ShapeElementGenerator {
  constructor(json, rootCoordinates) {
    super(json, rootCoordinates);
    this.svgString = STAR_RATING_ELEMENT;
  }

  generateStarSvg() {
    const { width, height, fill, stroke, strokeWidth, overlayFill, alpha } =
      this.json;
    let svgString = this.svgString;

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

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svg = svgDoc.querySelector("svg");

    if (svg) {
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);

      // Add overlay if specified
      if (overlayFill && alpha) {
        const overlay = svg.cloneNode(true);
        const overlayPaths = overlay.querySelectorAll("path");
        overlayPaths.forEach((path) => {
          path.setAttribute("fill", overlayFill);
          path.setAttribute("opacity", alpha);
        });
        svg.appendChild(overlay);
      }

      return svg.outerHTML;
    }

    return `<svg width="${width}" height="${height}"></svg>`;
  }

  async generate() {
    const svgContent = this.generateStarSvg();
    return this.wrapperDiv(svgContent);
  }
}

export async function convertShapeJsonToHtml(json, rootCoordinates) {
  const generator = new ShapeElementGenerator(json, rootCoordinates);
  return generator.generate();
}

export async function convertLineJsonToHtml(json, rootCoordinates) {
  const generator = new LineElementGenerator(json, rootCoordinates);
  return generator.generate();
}

export async function convertStarRatingJsonToHtml(json, rootCoordinates) {
  const generator = new StarRatingGenerator(json, rootCoordinates);
  return generator.generate();
}
