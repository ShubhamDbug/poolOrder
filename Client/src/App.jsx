// src/App.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "./components/Shell";

export default function App({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
      navigate("/"); // 👈 always redirect here on refresh
    }
  }, [navigate]);

  return <Shell>{children}</Shell>;
}
