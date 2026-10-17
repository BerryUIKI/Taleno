import { render } from "solid-js/web";
import App from "./App";
import "./styles/global.css";
import "katex/dist/katex.min.css";

// Initialize theme from settings store (side-effect import)
import "./store/settings";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

render(() => <App />, root);
