import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { UserLocationProvider } from "./context/UserLocationContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <UserLocationProvider>
        <AppRoutes />
      </UserLocationProvider>
    </BrowserRouter>
  </StrictMode>
);
