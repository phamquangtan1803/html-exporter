// Simple kebabCase function to replace lodash dependency
function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export class ElementGenerator {
  constructor(json, rootCoordinates, styleGenerators) {
    this.styleGenerators = styleGenerators;
    this.json = json;
    this.rootCoordinates = rootCoordinates;
  }

  generateStyles() {
    return this.styleGenerators.reduce(
      (styles, generator) => ({
        ...styles,
        ...generator.generate(),
      }),
      {}
    );
  }

  cssify(styleObject) {
    return Object.entries(styleObject)
      .filter(([_, value]) => value != null && value !== "")
      .map(([key, value]) => `${kebabCase(key)}: ${value}`)
      .join("; ");
  }

  svgToBase64(svgString) {
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
  }

  isHyperLink(hyperlink, child, type = "") {
    if (!hyperlink && type !== "image") return child;

    return `
      <a
        style="
          display:block;
          width: 100%; 
          color: inherit !important;
          cursor: ${hyperlink ? "pointer" : "default"} "
        ${hyperlink ? `target= "_blank"` : ""}
        href="${hyperlink || `#`}"
      >
        ${child}
      </a>
    `;
  }

  calcMarginDimension(subtractHeight = 0) {
    const {
      x: rootX = 0,
      y: rootY = 0,
      width: rootWidth,
    } = this.rootCoordinates;
    const { x, y, width, padding, strokeBgWidth, strokeWidth, elementType } =
      this.json;

    const stroke = (strokeBgWidth || strokeWidth) / 2;
    const paddingHorizontal = padding?.horizontal || 0;
    const paddingVertical = padding?.vertical || 0;
    const marginLeft = x - rootX - paddingHorizontal - stroke;
    const marginTop = y - rootY - paddingVertical - subtractHeight - stroke;
    const marginRight = rootWidth - marginLeft - width;

    if (
      elementType === "image" ||
      elementType === "line" ||
      elementType === "line_outline"
    ) {
      return {
        marginLeft: `${x - rootX}px`,
        marginTop: `${y - rootY}px`,
      };
    }

    if (Math.abs(marginLeft - marginRight) <= 2) {
      return {
        marginTop: `${marginTop}px`,
        marginLeft: "auto",
        marginRight: "auto",
      };
    }

    if (marginLeft === 0) {
      return {
        marginTop: `${marginTop}px`,
      };
    }

    if (marginRight === 0) {
      return {
        marginLeft: `auto`,
        marginTop: `${marginTop}px`,
      };
    }

    return {
      marginLeft: `${marginLeft}px`,
      marginTop: `${marginTop}px`,
    };
  }

  calcCropParams() {
    // original image.
    const shape1 = {
      x: 0,
      y: 0,
      width: this.json.imageWidth,
      height: this.json.imageHeight,
    };
    // cropped image.
    const shape2 = {
      x: this.json.cropX * shape1.width,
      y: this.json.cropY * shape1.height,
      width: this.json.cropWidth * shape1.width,
      height: this.json.cropHeight * shape1.height,
    };
    // image render on canvas.
    const shape3 = {
      x: this.json.x - this.rootCoordinates.x,
      y: this.json.y - this.rootCoordinates.y,
      width: this.json.width,
      height: this.json.height,
    };
    // cropped image render on canvas if cropped image is larger than canvas.
    const shape4 = {
      x: shape3.x >= 0 ? 0 : -shape3.x,
      y: shape3.y >= 0 ? 0 : -shape3.y,
      width: 0,
      height: 0,
    };
    shape4.width = Math.min(
      this.rootCoordinates.width - shape4.x - shape3.x,
      shape3.width - shape4.x
    );
    shape4.height = Math.min(
      this.rootCoordinates.height - shape4.y - shape3.y,
      shape3.height - shape4.y
    );

    let cropX = shape2.x + (shape4.x * shape2.width) / shape3.width;
    let cropY = shape2.y + (shape4.y * shape2.height) / shape3.height;
    const cropWidth = (shape2.width * shape4.width) / shape3.width;
    const cropHeight = (shape2.height * shape4.height) / shape3.height;

    if (this.json.flipVertical) {
      cropY = shape1.height - cropY - cropHeight;
    }

    if (this.json.flipHorizontal) {
      cropX = shape1.width - cropX - cropWidth;
    }

    return {
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    };
  }

  async cropImage() {
    const {
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    } = this.calcCropParams();

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.crossOrigin = "Anonymous";
      img.src = this.json.src;
      const type = this.json.src.split(".").pop();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
        const isJpg = type === "jpg" || type === "jpeg";
        const quality = isJpg ? 0.8 : undefined;
        resolve(canvas.toDataURL(`image/${isJpg ? "jpeg" : type}`, quality));
      };

      img.onerror = (error) => reject(error);
    });
  }
}

export class StyleGenerator extends ElementGenerator {
  constructor(props, rootCoordinates) {
    super(props, rootCoordinates);
    this.props = props;
    this.rootCoordinates = rootCoordinates;
  }

  generate() {
    return {};
  }
}

export class BorderStyleGenerator extends StyleGenerator {
  generate() {
    return {
      ...this.getBorderStyles(),
      ...this.getBorderRadius(),
    };
  }

  getBorderStyles() {
    const { strokeWidth, strokeBgWidth, stroke, strokeBackground } = this.props;

    if (!strokeBgWidth && !strokeWidth) return {};

    return {
      borderWidth: `${(strokeBgWidth || strokeWidth) / 2}px`,
      borderStyle: "solid",
      borderColor: strokeBackground || stroke || "transparent",
    };
  }

  getBorderRadius() {
    const {
      cornerRadiusTopLeft = 0,
      cornerRadiusTopRight = 0,
      cornerRadiusBottomLeft = 0,
      cornerRadiusBottomRight = 0,
    } = this.props;

    const corners = [
      cornerRadiusTopLeft,
      cornerRadiusTopRight,
      cornerRadiusBottomRight,
      cornerRadiusBottomLeft,
    ];
    const borderRadius = corners.every((c) => c === corners[0])
      ? `${corners[0]}px`
      : corners.map((c) => `${c}px`).join(" ");

    return {
      borderRadius,
    };
  }
}
