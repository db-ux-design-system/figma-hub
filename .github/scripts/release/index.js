/*
 * Handles full release process for all assets
 */

import uploadAsset from "./upload-asset.js";
import zipFolder from "./zip-folder.js";

const release = async ({ github, context, workspace, zipName, srcDir }) => {
  const { id: release_id } = context.payload.release;

  // 3. Upload latest icon assets
  const destPath = `${workspace}/${srcDir}`;
  const assetPath = `${destPath}/${zipName}.zip`;
  await zipFolder(destPath, assetPath);

  // 3.1 Upload to current release
  await uploadAsset({
    github,
    context,
    release_id,
    assetName: `${zipName}.zip`,
    assetPath,
  });
};

export default release;
