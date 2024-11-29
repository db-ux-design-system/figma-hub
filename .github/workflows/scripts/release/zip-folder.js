/* Zips a complete folder */

import AdmZip from "adm-zip";

const zipFolder = async (destPath, assetPath) => {
  const zip = new AdmZip();
  zip.addLocalFolder(`${destPath}/dist`);
  zip.addLocalFile(`${destPath}/manifest.json`);
  return zip.writeZipPromise(assetPath);
};

export default zipFolder;
