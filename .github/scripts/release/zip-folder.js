/* Zips a complete folder */

import AdmZip from "adm-zip";

import { existsSync } from "node:fs";

const zipFolder = async (destPath, assetPath) => {
  const zip = new AdmZip();
  const indexHtmlPath = `${destPath}/index.html`;
  if (existsSync(indexHtmlPath)) {
    zip.addLocalFile(`${destPath}/index.html`);
  }
  zip.addLocalFile(`${destPath}/index.js`);
  zip.addLocalFile(`${destPath}/manifest.json`);
  return zip.writeZipPromise(assetPath);
};

export default zipFolder;
