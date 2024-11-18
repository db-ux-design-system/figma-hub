import { handleDevCodegen } from "./modes/dev-codegen.js";

if (figma.editorType === "dev") {
  if (figma.mode === "codegen") {
    handleDevCodegen();
  }
}
