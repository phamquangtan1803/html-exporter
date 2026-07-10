export const prefetchFonts = async (src) => {
  const response = await fetch(src);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  return `data:font/truetype;charset=utf-8;base64,${base64}`;
};

const blobToBase64 = (blob) => {
  return new Promise(async (resolve) => {
    const buffer = await blob.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);
    resolve(nodeBuffer.toString("base64"));
  });
};
