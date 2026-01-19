import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@db-ui/foundations/build/styles/index.css";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
