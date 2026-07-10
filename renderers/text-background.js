export const renderTextPath = ({
  textArr,
  radius,
  horizontalAlign,
  verticalAlign,
  elementWidth,
  elementHeight,
  padding = { horizontal: 0, vertical: 0 },
  strokeWidth = 0,
}) => {
  radius = textArr.reduce((acc, line, index) => {
    const minWH = Math.min(
      line.width,
      line.height,
      Math.abs(line.width - (textArr[index - 1]?.width ?? 0))
    );
    return Math.min(acc, minWH / 2);
  }, radius || 0);
  const isCenter = horizontalAlign === "center";
  const isStart =
    horizontalAlign === "left" ||
    horizontalAlign === "start" ||
    horizontalAlign === "justify";
  const isEnd = horizontalAlign === "right" || horizontalAlign === "end";

  const maxX =
    elementWidth - textArr?.[0]?.width + 2 * padding.horizontal + strokeWidth ||
    0;
  const maxY =
    elementHeight -
      textArr?.reduce((acc, line) => acc + line.height, 0) +
      2 * padding.vertical || 0;
  const startX =
    maxX * (isCenter ? 0.5 : isEnd ? 1 : 0) +
    radius * (isStart | isEnd ? 1 : 0);
  const startY =
    maxY *
    (verticalAlign === "middle" ? 0.5 : verticalAlign === "bottom" ? 1 : 0);

  let textBackgroundPath = "";
  textBackgroundPath += `M ${startX} ${startY} \n`;
  textBackgroundPath += `h ${textArr[0].width - 2 * radius} \n`;
  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${radius} ${radius} \n`;
  textBackgroundPath += `v ${textArr[0].height - 2 * radius} \n`;

  for (let i = 1; i < textArr.length; i++) {
    let isLargerThanPrevious = textArr[i].width > textArr[i - 1].width;
    textBackgroundPath += !isEnd
      ? `a ${radius} ${radius}, 0, 0, ${isLargerThanPrevious ? "0" : "1"}, ${
          radius * (isLargerThanPrevious ? 1 : -1)
        } ${radius} \n`
      : "";
    textBackgroundPath += `h ${
      ((textArr[i].width - textArr[i - 1].width) * (isCenter ? 0.5 : 1) -
        (isLargerThanPrevious ? 1 : -1) * 2 * radius) *
      !isEnd
    }\n`;
    textBackgroundPath += !isEnd
      ? `a ${radius} ${radius}, 0, 0, ${!isLargerThanPrevious ? "0" : "1"}, ${
          radius * (isLargerThanPrevious ? 1 : -1)
        } ${radius} \n`
      : "";
    textBackgroundPath += `v ${textArr[i].height - 2 * radius * !isEnd} \n`;
  }

  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${-radius} ${radius} \n`;
  textBackgroundPath += `h ${-(
    textArr[textArr.length - 1].width -
    2 * radius
  )} \n`;
  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${-radius} ${-radius} \n`;
  textBackgroundPath += `v ${-(
    textArr[textArr.length - 1].height -
    2 * radius
  )} \n`;

  for (let i = textArr.length - 1; i > 0; i--) {
    let isLargerThanPrevious = textArr[i].width > textArr[i - 1].width;
    textBackgroundPath += !isStart
      ? `a ${radius} ${radius}, 0, 0, ${!isLargerThanPrevious ? "0" : "1"}, ${
          radius * (!isLargerThanPrevious ? -1 : 1)
        } ${-radius} \n`
      : "";
    textBackgroundPath += `h ${
      ((textArr[i].width - textArr[i - 1].width) * (isCenter ? 0.5 : 1) -
        (isLargerThanPrevious ? 1 : -1) * 2 * radius) *
      !isStart
    }\n`;
    textBackgroundPath += !isStart
      ? `a ${radius} ${radius}, 0, 0, ${isLargerThanPrevious ? "0" : "1"}, ${
          radius * (!isLargerThanPrevious ? -1 : 1)
        } ${-radius} \n`
      : "";
    textBackgroundPath += `v ${-(
      textArr[i - 1].height -
      2 * radius * !isStart
    )} \n`;
  }

  textBackgroundPath += `a ${radius} ${radius}, 0, 0, 1, ${radius} ${-radius} \n`;
  textBackgroundPath += "Z\n";
  return textBackgroundPath;
};

export const getTextBackground = ({
  textArr,
  radius,
  horizontalAlign,
  verticalAlign,
  elementWidth,
  elementHeight,
  bgFill = "transparent",
  stroke = "transparent",
  strokeWidth = 0,
  padding,
}) => {
  const cloneRichText = JSON.parse(JSON.stringify(textArr));
  const modifiedRichTextArr = cloneRichText.map((line, index) => {
    return {
      ...line,
      width: line.width + strokeWidth + padding.horizontal * 2,
      height:
        line.height +
        (padding.vertical * 2 + strokeWidth) *
          ((index === 0 ||
          (index !== 0 && cloneRichText[index - 1].width < line.width)
            ? 0.5
            : -0.5) +
            (index === cloneRichText.length - 1 ||
            (index !== cloneRichText.length - 1 &&
              cloneRichText[index + 1].width < line.width)
              ? 0.5
              : -0.5)),
    };
  });
  const renderParams = {
    textArr: modifiedRichTextArr,
    radius,
    horizontalAlign,
    verticalAlign,
    elementWidth: elementWidth,
    elementHeight: elementHeight,
    padding,
    strokeWidth,
  };
  const fillPath = renderTextPath(renderParams);

  const svgWidth = elementWidth + padding.horizontal * 2 + strokeWidth * 2;
  const svgHeight = elementHeight + padding.vertical * 2 + strokeWidth * 2;

  return `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="${
    -strokeWidth / 2
  } ${-strokeWidth / 2} ${svgWidth} ${svgHeight}">
    <path d="${fillPath}" fill="${bgFill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
  </svg>`;
};
