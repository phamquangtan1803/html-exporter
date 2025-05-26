import axios from "axios";
import { genreateLayoutHtml } from "./renderers/layout.js";
import fs from "fs";

async function generateHTML(apiUrl, options = {}) {
  try {
    console.log(`Fetching data from API: ${apiUrl}`);

    const jsonData = await fetchAPIData(apiUrl);

    const layoutHtml = await genreateLayoutHtml({
      page: jsonData.data,
    });
    console.log("Data fetched successfully:", jsonData);

    return layoutHtml;
  } catch (error) {
    console.error("Error generating HTML:", error.message);
    throw error;
  }
}

async function fetchAPIData(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("API request timeout");
    } else if (error.response) {
      throw new Error(
        `API request failed: ${error.response.status} ${error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error("API request failed: No response received");
    } else {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

async function main(templateSizeId = "a62fdc60b03e4587abe23f0db23cebba") {
  try {
    const apiUrl = `https://stg-api.obello.com/template-service/animations/list?template_size_id=${templateSizeId}`;

    const data = await generateHTML(apiUrl);

    fs.writeFileSync("output.html", data, "utf8");
    console.log("Data written to output.html");
  } catch (error) {
    console.error("Error in main:", error.message);
  }
}

export { generateHTML, fetchAPIData };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
