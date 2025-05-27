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

export const mapVerticalAlignToFlex = new Map([
  ["top", "start"],
  ["middle", "center"],
  ["bottom", "end"],
]);

export const mapTextTransformToCSS = (textTransform) => {
  switch (textTransform) {
    case "sentenceCase":
      return "uppercase";
    case "uppercase":
      return "uppercase";
    case "titleCase":
      return "capitalize";
    default:
      return "none";
  }
};

export const getTextTransform = (text, textTransform) => {
  switch (textTransform) {
    case "sentenceCase":
      return text
        .split(".")
        .map((sentence) => {
          const firstLetter = sentence.search("[a-zA-Z]");
          return (
            sentence.charAt(firstLetter).toUpperCase() +
            sentence.slice(firstLetter + 1).toLowerCase()
          );
        })
        .join(".");
    case "uppercase":
      return text.toUpperCase();
    case "titleCase":
      return text
        .split(" ")
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    default:
      return text;
  }
};

export const textJsonToHtml = (json) => {
  console.log("myjson", json);
  const text = getTextTransform(json.text || "", json.textTransform || "none");
  const textStyles = {
    textDecoration: json.textDecoration || "none",
    color: json.textFill || "black",
    "font-size": `${json.fontSize || 16}px`,
    "text-align": json.align || "left",
    "align-self": mapVerticalAlignToFlex.get(json.verticalAlign || "middle"),
    "letter-spacing": `${json.letterSpacing || 0}px`,
    "line-height": json.lineHeight ? `${json.lineHeight}` : "normal",
    "border-radius": `${json.cornerRadiusTopLeft || 0}px ${
      json.cornerRadiusTopRight || 0
    }px ${json.cornerRadiusBottomRight || 0}px ${
      json.cornerRadiusBottomLeft || 0
    }px`,
    padding: `${json.padding?.vertical || 0}px ${
      json.padding?.horizontal || 0
    }px`,
    "background-color": json.fill || "inherit",
  };

  const cssTextStyles = cssify(textStyles);

  return `<div style="${cssTextStyles}">${text}</div>`;
};
