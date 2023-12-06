import fs from "fs";
import transform from "./transform.js";

const cssFilePath = "./src/styles.css";

try {
  const cssContent = fs.readFileSync(cssFilePath, "utf8");
  const cssObject = transform(cssContent);
  console.log(cssObject);
} catch (error) {
  console.error(`Failed to read CSS file: ${error.message}`);
}
