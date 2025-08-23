// src/App.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "./components/Shell";

export default function App({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length && navEntries[0].type === "reload") {
      navigate("/"); // 👈 change to "/login" or "/home" if you prefer
    }
  }, [navigate]);

  return <Shell>{children}</Shell>;
}
