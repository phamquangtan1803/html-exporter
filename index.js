import axios from "axios";
import { generateLayoutHtml } from "./renderers/layout.js";
import fs from "fs";
import util from "util";

async function generateHTML(apiUrl, options = {}) {
  try {
    console.log(`Fetching data from API: ${apiUrl}`);

    const jsonData = await fetchAPIData(apiUrl);

    console.log(
      "Data fetched from API:",
      util.inspect(jsonData, false, null, true)
    );

    const layoutHtml = await generateLayoutHtml({
      page: jsonData.data[0],
    });

    console.log("Layout created");

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
    console.log(process.cwd() + "\\output.html");
    fs.writeFileSync(process.cwd() + "\\output.html", data, "utf8");
    console.log("Data written to output.html");
  } catch (error) {
    console.error("Error in main:", error.message);
  }
}

export { generateHTML, fetchAPIData };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main("75d59d9d18de4e30b8f8ab847c95cf6a");
}

main("849a36181ced4e059bb690a0d5fee3d3");
