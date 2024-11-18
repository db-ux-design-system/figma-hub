import { handleDevInspect } from "./modes/dev-inspect.js";

if (figma.editorType === "dev") {
  if (figma.mode === "inspect") {
    handleDevInspect();
  }
}
