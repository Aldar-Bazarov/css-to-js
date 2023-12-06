import fs from "fs";
import transform from "./parse-variables.js";

const variablesFilePath = "./src/variables.less";

try {
  const lessContent = fs.readFileSync(variablesFilePath, "utf8");
  const lessVariables = transform(lessContent);
  console.log(lessVariables);
} catch (error) {
  console.error(`Failed to read CSS file: ${error.message}`);
}
