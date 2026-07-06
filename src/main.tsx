import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: register the service worker (required for Android install prompt).
// Skipped in dev — the SW would cache-shadow Vite's HMR modules.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* non-fatal — the app works without offline support */
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
