import { PLATFORM_TAGS, TOAST_STATE } from "@constants/index";
import { getUploadUrlEmailAsset } from "@services";
import { uploadFileToS3 } from "@services/uploadServices";
import { promiseToastStateStore } from "@states/promiseToastState";
import { parse, stringify } from "flatted";
import { openDB } from "idb";
import JSZip from "jszip";
import prettier from "prettier";
import htmlParser from "prettier/parser-html";
import { v4 as uuidv4 } from "uuid";

import {
  HEIGHT_REGEX,
  ID_REGEX,
  IMAGE_REGEX,
  SRC_REGEX,
  WIDTH_REGEX,
} from "./constant";
import { combineLayoutAndElements } from "./layout";

function minifyInlineStyles(html) {
  return html.replace(/style="([^"]+)"/g, (match, styles) => {
    const minifiedStyle = styles
      .split(";")
      .filter((style) => style.trim())
      .map((style) => {
        const [property, value] = style.split(":").map((s) => s.trim());
        return `${property}:${value}`;
      })
      .join(";");
    return `style="${minifiedStyle}"`;
  });
}

function getAllImageURLs(html) {
  const imageTags = html.match(IMAGE_REGEX);
  if (!imageTags) return;
  return imageTags.map((img) => {
    const srcMatch = img.match(SRC_REGEX);
    const idMatch = img.match(ID_REGEX);
    const widthMatch = img.match(WIDTH_REGEX);
    const heightMatch = img.match(HEIGHT_REGEX);

    return {
      src: srcMatch ? srcMatch[1] : null,
      filename: idMatch ? idMatch[1] : null,
      width: widthMatch ? Number(widthMatch[1]) : null,
      height: heightMatch ? Number(heightMatch[1]) : null,
    };
  });
}

function generateFolderName(name) {
  if (!name) {
    return "mail-template";
  }
  return `${name.toLowerCase().replace(/\s+/g, "-").split(" ").join("-")}`;
}

function exportType(src, prefix = "") {
  if (src.startsWith("data:image/jpeg") || src.startsWith("data:image/jpg")) {
    return `${prefix}jpeg`;
  }
  if (src.startsWith("data:image/gif")) {
    return `${prefix}gif`;
  }
  if (src.startsWith("data:image/webp")) {
    return `${prefix}webp`;
  }

  return `${prefix}png`;
}

async function uploadImage({ imageUrl, quality, presignedUrl }) {
  const { src, width, height } = imageUrl;
  const type = exportType(src, "image/");
  const blob = await convertBase64SvgToBlob({
    type,
    width,
    height,
    base64Svg: src,
    quality,
  });
  return uploadFileToS3({ blob, presignedUrl });
}

async function convertBase64SvgToBlob({
  base64Svg,
  width,
  height,
  quality,
  type,
}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2 || img.width;
      canvas.height = height * 2 || img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to convert image to blob"));
        },
        type,
        quality
      );
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = base64Svg;
  });
}

function replaceSrc(htmlContent, s3Files) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  for (const { refId, cdnUrl } of s3Files) {
    const img = doc.getElementById(refId);
    if (img) {
      img.src = cdnUrl;
    }
  }

  return doc.documentElement.outerHTML;
}

function replaceMergeTags(htmlContent, platformType) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const mention = doc.querySelectorAll(".mention");
  const platformTag = PLATFORM_TAGS[platformType];

  if (!platformTag) {
    console.warn(
      `Platform type "${platformType}" is not defined in PLATFORM_TAGS.`
    );
    return htmlContent;
  }

  if (!mention) return htmlContent;

  for (const el of Array.from(mention)) {
    const parent = el.parentElement;

    const tagNameUpper = el.firstChild.innerHTML.trim().toUpperCase();
    el.innerHTML = platformTag[tagNameUpper] || el.innerHTML;

    if (parent && parent.tagName === "U") {
      const span = document.createElement("span");
      span.appendChild(parent.children[0]);
      parent.replaceWith(span);
    }
  }

  return doc.documentElement.outerHTML;
}

function cleanBase64Data(dataUrl) {
  if (!dataUrl) return null;
  return dataUrl.split(",")[1];
}

export function downloadMultipleType(data, template) {
  const { createToast } = promiseToastStateStore;

  const { templateName } = template;
  const { stageAttrs, layerNode, scale, height, width } = emailStore;
  const { offsetX, offsetY } = stageAttrs;

  try {
    const emailImgBase64 = layerNode.toDataURL({
      width: width * scale,
      height: height * scale,
      x: Math.abs(offsetX) * scale,
      y: Math.abs(offsetY) * scale,
      pixelRatio: 2 / scale,
    });

    const zip = new JSZip();
    const folderName = generateFolderName(templateName);
    const zipFolder = zip.folder(folderName);
    const types = Object.keys(data).filter((key) => data[key] === true);

    const a = document.createElement("a");
    a.href = emailImgBase64;

    if (types.length > 1) {
      types.forEach((type) => {
        zipFolder.file(
          `${folderName}.${type}`,
          cleanBase64Data(emailImgBase64),
          {
            base64: true,
          }
        );
      });

      zipFolder.generateAsync({ type: "blob" }).then((content) => {
        const downloadUrl = URL.createObjectURL(content);
        const downloadLink = document.createElement("a");
        downloadLink.href = downloadUrl;
        downloadLink.download = folderName + ".zip";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl);
      });
    } else {
      switch (types[0]) {
        case "png":
          a.download = `${folderName}.png`;
          a.click();
          break;
        case "jpeg":
          a.download = `${folderName}.jpeg`;
          a.click();
          break;

        default:
          break;
      }
    }

    createToast({
      label: "Download completed",
      status: TOAST_STATE.SUCCESS,
      isLoading: false,
      duration: 3,
    });
  } catch (error) {
    createToast({
      label: "Something went wrong. Please try again.",
      status: TOAST_STATE.ERROR,
      isLoading: false,
      duration: 3,
    });
    console.error("Error creating zip file:", error);
  }
}

export async function downloadAsZip(template, platformType, quality = 1) {
  const { createToast } = promiseToastStateStore;
  try {
    var imageUrls = [];
    const zip = new JSZip();
    const folderName = generateFolderName(template.templateName);
    const zipFolder = zip.folder(folderName);

    let htmlContent = await combineLayoutAndElements({ isExporting: true });

    imageUrls = getAllImageURLs(htmlContent);

    const matches = htmlContent.match(IMAGE_REGEX);
    if (matches) {
      const params = matches.map((match) => {
        if (!matches || !imageUrls) return;

        const idMatch = match.match(ID_REGEX);
        const originalSrc = match.match(SRC_REGEX);

        if (!idMatch || !originalSrc) return;

        const id = idMatch[1];
        const imageUrl = imageUrls.find(({ filename }) => filename === id);
        const fileExtension = exportType(imageUrl.src);

        if (imageUrl) {
          return {
            refId: imageUrl.filename,
            fileName: `${uuidv4()}.${fileExtension}`,
          };
        }

        return null;
      });

      const objectS3Files = await getUploadUrlEmailAsset({
        assets: params,
      });

      const s3Files = objectS3Files.map((file) => {
        const imageUrl = imageUrls.find(
          ({ filename }) => filename === file.refId
        );

        return uploadImage({
          imageUrl,
          quality,
          presignedUrl: file.uploadUrl,
        });
      });

      await Promise.all(s3Files);

      htmlContent = replaceSrc(htmlContent, objectS3Files);
    }

    htmlContent = replaceMergeTags(htmlContent, platformType);

    zipFolder?.file("index.html", htmlContent);

    const zipBlob = await zipFolder.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(zipBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = folderName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);

    createToast({
      label: "Download completed",
      status: TOAST_STATE.SUCCESS,
      isLoading: false,
      duration: 3,
    });
  } catch (error) {
    createToast({
      label: "Something went wrong. Please try again.",
      status: TOAST_STATE.ERROR,
      isLoading: false,
      duration: 3,
    });
    console.error("Error creating zip file:", error);
  }
}

export function formatHTML(html) {
  const formattedHtml = prettier.format(html, {
    parser: "html",
    plugins: [htmlParser],
    tabWidth: 2,
    useTabs: false,
    htmlWhitespaceSensitivity: "css",
    bracketSameLine: false,
    singleAttributePerLine: true,
  });

  return minifyInlineStyles(formattedHtml);
}

export function isEqualJson(a, b) {
  return stringify(a) === stringify(b);
}

export function stripFunctions(obj) {
  return parse(stringify(obj));
}

const DB_NAME = "html-db";
const STORE_NAME = "compressed-html";

async function getDb() {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function storeCompressedHtmlToIndexedDB(key, html) {
  const db = await getDb();
  const compressed = html;
  await db.put(STORE_NAME, compressed, key);
}

export async function getCompressedHtmlFromIndexedDB(key) {
  const db = await getDb();
  const compressed = await db.get(STORE_NAME, key);
  if (!compressed) return null;
  return compressed;
}

export async function deleteCompressedHtmlFromIndexedDB(key) {
  const db = await getDb();
  await db.delete(STORE_NAME, key);
}
