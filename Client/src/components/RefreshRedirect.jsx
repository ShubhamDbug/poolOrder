import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Any path you want to bounce to "/" on full page reload:
const BLOCKED = new Set(["/chat", "/create", "/mine"]);

export default function RefreshRedirect() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Modern API
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const isReloadNew = nav?.type === "reload";
    // Legacy fallback
    const isReloadOld = typeof performance?.navigation?.type === "number"
      ? performance.navigation.type === 1
      : false;

    if ((isReloadNew || isReloadOld) && BLOCKED.has(pathname)) {
      navigate("/", { replace: true });
    }
  }, [pathname, navigate]);

  return null;
}
