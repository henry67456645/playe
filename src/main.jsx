import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import "./index.css";

const setViewportHeight = () => {
  document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
};

setViewportHeight();
window.addEventListener("resize", setViewportHeight);

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);