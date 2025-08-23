import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Providers
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiProvider } from "@/contexts/ApiContext";
import { ToastProvider } from "@/contexts/ToastContext";

// App shell & utilities
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import RefreshRedirect from "./components/RefreshRedirect.jsx";

// Pages
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
                {/* Runs on every navigation; does nothing unless it's a real reload */}
                <RefreshRedirect />
                <Routes>
                  <Route path="/" element={<Nearby />} />
                  <Route path="/create" element={<Create />} />
                  <Route path="/mine" element={<Mine />} />
                  <Route path="/chat" element={<Chat />} />
                  {/* Optionally add a catch-all NotFound route */}
                  {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
                </Routes>
              </App>
            </ToastProvider>
          </ApiProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
