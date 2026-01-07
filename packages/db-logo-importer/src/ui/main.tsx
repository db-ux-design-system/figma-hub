import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@db-ux/core-components/build/styles/rollup.css";
import "@db-ux/db-theme/build/styles/rollup.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
