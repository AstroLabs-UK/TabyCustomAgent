import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FaceWindowApp } from "./device/FaceWindowApp";
import "./styles/tokens.css";

const params = new URLSearchParams(window.location.search);
const isFaceWindow =
  params.get("face") === "1" || params.get("window") === "face";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isFaceWindow ? <FaceWindowApp /> : <App />}
  </React.StrictMode>
);
