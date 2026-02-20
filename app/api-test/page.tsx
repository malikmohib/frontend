"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/http";

export default function ApiTestPage() {
  const [status, setStatus] = useState("Testing...");

  useEffect(() => {
    apiFetch("/openapi.json")
      .then((data) => {
        console.log("API OK:", data);
        setStatus("✅ Connected to backend (openapi.json loaded). Check Console log.");
      })
      .catch((err) => {
        console.error("API ERROR:", err);
        setStatus(`❌ API error: ${String(err?.message ?? err)}`);
      });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>API Test</h1>
      <p>{status}</p>
      <p>
        Backend base URL: <code>{process.env.NEXT_PUBLIC_API_BASE_URL}</code>
      </p>
    </div>
  );
}
