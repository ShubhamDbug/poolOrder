import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// ⬇️ ONE-SHOT redirect on real page refresh only
const BLOCKED = new Set(["/chat", "/create", "/mine"]);
(function redirectOnHardReload() {
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const isReloadNew = nav?.type === "reload";
    const isReloadOld =
      typeof performance?.navigation?.type === "number"
        ? performance.navigation.type === 1 // TYPE_RELOAD
        : false;
    const isReload = isReloadNew || isReloadOld;

    const path = window.location.pathname;
    if (isReload && BLOCKED.has(path)) {
      window.location.replace("/");
    }
  } catch {}
})();
// Providers
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiProvider } from "@/contexts/ApiContext";
import { ToastProvider } from "@/contexts/ToastContext";

// App & pages
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import Nearby from "./Pages/Nearby.jsx";
import Create from "./Pages/Create.jsx";
import Mine from "./Pages/Mine.jsx";
import Chat from "./Pages/Chat.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ApiProvider>
            <ToastProvider>
              <App>
                <Routes>
                  <Route path="/" element={<Nearby />} />
                  <Route path="/create" element={<Create />} />
                  <Route path="/mine" element={<Mine />} />
                  <Route path="/chat" element={<Chat />} />
                </Routes>
              </App>
            </ToastProvider>
          </ApiProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
