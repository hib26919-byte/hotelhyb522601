import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { NotificationProvider } from "./context/NotificationContext";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Intentionally silent to keep initial boot resilient.
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <BookingProvider>
              <ErrorBoundary>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: "#1A1A1A",
                      color: "#FAF8F5",
                      border: "1px solid rgba(201, 168, 76, 0.25)",
                    },
                  }}
                />
              </ErrorBoundary>
            </BookingProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);

