export const getLogoPaddingValues = (
  image,
  maxContainerWidth,
  maxContainerHeight,
  paddingRatio,
  paddingOptions,
  scale = 1
) => {
  if (!image || !image.width || !image.height) return;
  let logoWidth = image.width * scale;
  let logoHeight = image.height * scale;
  let padding;
  let containerWidth;
  let containerHeight;

  if (logoWidth === logoHeight) {
    padding = (logoWidth / 2) * paddingRatio;
    containerWidth = logoWidth + padding * 2;
    containerHeight = logoHeight + padding * 2;

    if (containerHeight > maxContainerHeight) {
      const ratio = maxContainerHeight / containerHeight;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth = maxContainerHeight;
      containerHeight = maxContainerHeight;
    }
  } else if (logoWidth > logoHeight) {
    padding = logoHeight * paddingRatio;
    containerWidth = logoWidth + padding * 2;
    containerHeight = logoHeight + padding * 2;

    if (containerWidth > maxContainerWidth) {
      const ratio = maxContainerWidth / containerWidth;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth = maxContainerWidth;
      containerHeight *= ratio;
    }

    if (containerHeight > maxContainerHeight) {
      const ratio = maxContainerHeight / containerHeight;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth *= ratio;
      containerHeight = maxContainerHeight;
    }
  } else {
    padding = logoWidth * paddingRatio;
    containerWidth = logoWidth + padding * 2;
    containerHeight = logoHeight + padding * 2;

    if (containerHeight > maxContainerHeight) {
      const ratio = maxContainerHeight / containerHeight;
      logoWidth *= ratio;
      logoHeight *= ratio;
      containerWidth *= ratio;
      containerHeight = maxContainerHeight;
    }
  }

  const paddingValue = (containerWidth - logoWidth) / 2;
  let paddingLeftValue = 0;
  let paddingTopValue = 0;
  let paddingRightValue = 0;
  let paddingBottomValue = 0;

  if (paddingOptions) {
    const { paddingRight, paddingLeft, paddingTop, paddingBottom } = paddingOptions;
    const isTopLeftCorner = !paddingTop && !paddingLeft;
    const isTopRightCorner = !paddingTop && !paddingRight;
    const isBottomLeftCorner = !paddingBottom && !paddingLeft;
    const isBottomRightCorner = !paddingBottom && !paddingRight;
    const isTopMiddle = !paddingTop && paddingLeft && paddingRight;
    const isBottomMiddle = !paddingBottom && paddingLeft && paddingRight;
    const isLeftMiddle = !paddingLeft && paddingTop && paddingBottom;
    const isRightMiddle = !paddingRight && paddingTop && paddingBottom;
    const isCenter = paddingTop && paddingBottom && paddingLeft && paddingRight;

    if (
      isTopLeftCorner ||
      isBottomLeftCorner ||
      isTopRightCorner ||
      isBottomRightCorner
    ) {
      paddingLeftValue = paddingValue;
      paddingTopValue = paddingValue;
      paddingRightValue = paddingValue;
      paddingBottomValue = paddingValue;
    }

    if (paddingTop) {
      if (isLeftMiddle || isRightMiddle || isCenter) {
        paddingTopValue = Math.max(
          paddingValue,
          (maxContainerHeight - logoHeight) / 2
        );
      } else {
        paddingTopValue = maxContainerHeight - logoHeight;
      }
    } else {
      paddingTopValue = 0;
    }

    if (paddingLeft) {
      if (isTopMiddle || isBottomMiddle || isCenter) {
        paddingLeftValue = Math.max(
          paddingValue,
          (maxContainerWidth - logoWidth) / 2
        );
      } else {
        paddingLeftValue = maxContainerWidth - logoWidth;
      }
    } else {
      paddingLeftValue = 0;
    }

    if (paddingRight) {
      if (isTopMiddle || isBottomMiddle || isCenter) {
        paddingRightValue = Math.max(
          paddingValue,
          (maxContainerWidth - logoWidth) / 2
        );
      } else {
        paddingRightValue = maxContainerWidth - logoWidth;
      }
    } else {
      paddingRightValue = 0;
    }

    if (paddingBottom) {
      if (isLeftMiddle || isRightMiddle || isCenter) {
        paddingBottomValue = Math.max(
          paddingValue,
          (maxContainerHeight - logoHeight) / 2
        );
      } else {
        paddingBottomValue = maxContainerHeight - logoHeight;
      }
    } else {
      paddingBottomValue = 0;
    }
  }

  return {
    logoWidth,
    logoHeight,
    containerWidth,
    containerHeight,
    padding: {
      top: paddingTopValue,
      left: paddingLeftValue,
      right: paddingRightValue,
      bottom: paddingBottomValue,
    },
  };
};
