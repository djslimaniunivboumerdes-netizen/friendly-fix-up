import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSync } from "./lib/sync";

initSync();

createRoot(document.getElementById("root")!).render(<App />);
