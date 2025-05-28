export const imageJsonToHtml = (json) => {
  console.log("Image JSON:", json);
  const { src, x, y, width, height, rotation } = json;

  return `<img src="${src}"  />`;
};
