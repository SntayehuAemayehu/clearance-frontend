import React, { createContext, useEffect, useState } from "react";
import { apiFetch } from "../src/utils/api";

export const SystemContext = createContext();

export function SystemProvider({ children }) {
  const [system, setSystem] = useState(null);

  const loadSystem = async () => {
    try {
      const data = await apiFetch("/system-control/");
      if (Array.isArray(data) && data.length) setSystem(data[0]);
    } catch (err) {
      console.error("Failed to load system:", err);
    }
  };

  const updateSystem = async (payload) => {
    if (!system) return;
    await apiFetch(`/system-control/${system.id}/`, { method: "PUT", body: payload });
    loadSystem();
  };

useEffect(() => {
  const session = sessionStorage.getItem("ucs_current");
  if (session) loadSystem();
}, []);


  return (
    <SystemContext.Provider value={{ system, updateSystem }}>
      {children}
    </SystemContext.Provider>
  );
}
