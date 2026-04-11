import { useEffect } from "react";
import { api } from "../../utils/api";

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || (import.meta.env.PROD ? "https://ai-0nhv.onrender.com" : "http://localhost:8000");

export function ServerKeepAlive() {
  useEffect(() => {
    let intervalId: number;

    const pingBackend = async () => {
      try {
        await api.get("/ping");
      } catch (error) {
        console.warn("Backend keep-alive ping failed:", error);
      }
    };

    const pingAI = async () => {
      try {
        const response = await fetch(`${AI_BASE_URL}/ping`);
        if (!response.ok) throw new Error(`AI ping failed: ${response.status}`);
      } catch (error) {
        console.warn("AI keep-alive ping failed:", error);
      }
    };

    const pingAll = () => {
      pingBackend();
      pingAI();
    };

    pingAll();
    intervalId = window.setInterval(pingAll, 1000 * 60 * 5); // ping every 5 minutes

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
