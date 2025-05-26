import { getLogoPaddingValues } from "../utils/logo.js";

import { ElementGenerator } from "./base.js";

class LogoElementGenerator extends ElementGenerator {
  constructor(json, rootCoordinates) {
    super(json, rootCoordinates, []);
    this.json = json;
    this.rootCoordinates = rootCoordinates;
  }

  getPadding() {
    const { logoWidth, logoHeight, padding } = getLogoPaddingValues(
      {
        width: this.json.imageWidth,
        height: this.json.imageHeight,
      },
      this.json.width,
      this.json.height,
      this.json.paddingRatio,
      this.json.padding,
      this.json.logoScale
    );

    return { logoWidth, logoHeight, padding };
  }

  async changeSvgColor() {
    const response = await fetch(this.json.src);
    let svgContent = await response.text();
    if (this.json.fill && this.json.fill !== "transparent") {
      svgContent = svgContent.replace(
        /fill="[^"]*"/g,
        `fill="${this.json.fill}"`
      );
    }
    return svgContent;
  }

  changeSvgSize(svgContent) {
    svgContent = svgContent.replace(
      /width="[^"]*"/,
      `width="${this.json.imageWidth}"`
    );
    svgContent = svgContent.replace(
      /height="[^"]*"/,
      `height="${this.json.imageHeight}"`
    );

    return svgContent;
  }

  async convertToBase64() {
    let svgContent = await this.changeSvgColor();
    svgContent = this.changeSvgSize(svgContent);
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }

  async generate() {
    const { opacity, height, width, rotation, hyperlink } = this.json;

    const { logoWidth, logoHeight, padding } = this.getPadding();

    const logo = await this.convertToBase64();

    return `
        <div
          style="
            opacity: ${opacity}; 
            transform: rotate(${rotation}deg);
            transform-origin: top left;
            height: ${height}px; 
            width: ${width}px;
            max-width: 100%; 
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${padding.top}px ${padding.right}px ${padding.bottom}px ${
      padding.left
    }px;
            ${this.cssify(this.calcMarginDimension())};
          "
        >
          ${this.isHyperLink(
            hyperlink,
            `
            <img
              src="${logo}"
              id="logo-${this.json.id}"
              width="${logoWidth}"
              height="${logoHeight}"
              alt="logo"
              style="
                display: block;
              "
            />
            `
          )}
        </div>
      `;
  }
}

export async function convertLogoJsonToHtml(json, rootCoordinates) {
  const generator = new LogoElementGenerator(json, rootCoordinates);
  return generator.generate();
}
