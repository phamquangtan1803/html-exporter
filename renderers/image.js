import { convertHexToRgba } from "../utils/color.js";

import { BorderStyleGenerator, ElementGenerator } from "./base.js";

class ImageElementGenerator extends ElementGenerator {
  constructor(json, rootCoordinates) {
    super(json, rootCoordinates, [
      new BorderStyleGenerator(json, rootCoordinates),
    ]);
  }

  getBorderRadius() {
    const borderStyles = this.styleGenerators.find(
      (style) => style instanceof BorderStyleGenerator
    );
    if (!borderStyles) return {};

    return borderStyles.getBorderRadius();
  }

  async applyOverlay(imgUrl) {
    const { width, height, overlayFill, alpha } = this.json;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgUrl;
    });

    ctx.drawImage(img, 0, 0, width, height);

    ctx.fillStyle = convertHexToRgba(overlayFill, alpha);
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL("image/png");
  }

  async applyGradientBackground(imgUrl) {
    const { width, height, gradient } = this.json;
    if (!gradient || !gradient.configs || gradient.opacity === 0) return imgUrl;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgUrl;
    });
    ctx.drawImage(img, 0, 0, width, height);

    const gradientConfig = gradient.configs;
    const angle = (gradient.rotation * Math.PI) / 180;

    const x1 = width / 2 - (width / 2) * Math.cos(angle);
    const y1 = height / 2 - (width / 2) * Math.sin(angle);
    const x2 = width / 2 + (width / 2) * Math.cos(angle);
    const y2 = height / 2 + (width / 2) * Math.sin(angle);

    const gradientObj = ctx.createLinearGradient(x1, y1, x2, y2);

    gradientConfig.forEach((config) => {
      gradientObj.addColorStop(config.offset, config.color);
    });

    ctx.globalAlpha = gradient.opacity;
    ctx.fillStyle = gradientObj;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL("image/png");
  }

  async generate() {
    const {
      opacity,
      width,
      height,
      flipHorizontal,
      flipVertical,
      rotation = 0,
      shadowColor,
      shadowBlur,
      shadowOpacity,
      shadowOffsetX,
      shadowOffsetY,
      shadowEnabled,
      overlayFill,
      alpha,
      strokeWidth,
      stroke,
      strokeBgWidth,
      strokeBackground,
      id,
      hyperlink,
      elementType,
      fill,
      gradient,
    } = this.json;

    const isSmallImg = width / this.rootCoordinates.width <= 0.5;
    let imgUrl = await this.cropImage();

    if (overlayFill && alpha) {
      imgUrl = await this.applyOverlay(imgUrl);
    }

    if (gradient) {
      imgUrl = await this.applyGradientBackground(imgUrl);
    }

    const scale = `scale(${flipHorizontal ? -1 : 1}, ${flipVertical ? -1 : 1})`;
    const rotate = `rotate(${rotation}deg)`;

    const borderStyles = {
      overflow: "hidden",
      ...this.getBorderRadius(),
    };

    const outlineStyles = {
      outlineWidth: `${strokeBgWidth || strokeWidth}px`,
      outlineOffset: `-${strokeBgWidth || strokeWidth}px`,
      outlineColor: strokeBackground || stroke || "transparent",
      outlineStyle: "solid",
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 2,
    };

    const imageStyles = {
      boxSizing: "border-box",
      margin: 0,
      padding: 0,
      width: "100%",
      height: `${height}px`,
      maxWidth: `${width}px`,
      maxHeight: `${height}px`,
      objectFit: "cover",
      transform: `${scale}`,
    };

    const containerStyles = {
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
      opacity: opacity,
      maxWidth: "100%",
      overflow: "hidden",
      position: "relative",
      width: `${width}px ${isSmallImg ? "!important" : ""}`,
      height: `${height}px ${isSmallImg ? "!important" : ""}`,
      transform: `${rotate}`,
      transformOrigin: "top left",
      boxShadow:
        shadowEnabled && shadowColor
          ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${convertHexToRgba(
              shadowColor,
              shadowOpacity
            )}`
          : "none",
      backgroundColor: fill,
      ...this.getBorderRadius(),
      ...this.calcMarginDimension(),
    };

    const strokeElement = `
      <div style="${this.cssify({
        ...outlineStyles,
        ...borderStyles,
      })}">
      </div>
    `;

    return `
      <div
        class="${isSmallImg ? "small-img-container" : "element-container "}" 
        style="${this.cssify(containerStyles)}">
      ${this.isHyperLink(
        hyperlink,
        `
        <div>
          ${strokeElement}
          <div style="${this.cssify(borderStyles)}">
              <img
                src="${imgUrl}"
                id="cropped-image-${id}"
                width="${width}"
                height="${height}"
                alt="image"
                style="
                  ${this.cssify(imageStyles)};
                  mso-width-percent: 10000;
                  mso-height: auto;"
              />
          </div>
        </div>
        `,
        elementType
      )}
      </div>
    `;
  }
}

export async function convertImgJsonToHtml(json, rootCoordinates) {
  const generator = new ImageElementGenerator(json, rootCoordinates);
  return generator.generate();
}
