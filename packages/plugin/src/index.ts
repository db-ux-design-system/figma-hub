import { handleDevInspect } from "./modes/dev-inspect.js";
import { handleDevCodegen } from "./modes/dev-codegen.js";

if (figma.editorType === "dev") {
  if (figma.mode === "inspect") {
    handleDevInspect();
  } else if (figma.mode === "codegen") {
    handleDevCodegen();
  }
}
