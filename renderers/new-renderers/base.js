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
