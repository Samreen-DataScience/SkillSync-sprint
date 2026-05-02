import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "@/app/providers";
import { AppRouter } from "@/routes/app-router";
import "@/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </StrictMode>
);
