import React from "react";
import ReactDOM from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";
import { msalInstance, isSSOConfigured } from "@/auth/msalConfig";
import "@/index.css";
import App from "@/App";

/**
 * Initialize MSAL and render app.
 * Follows the same pattern as Albertsons SDIM Impact app.
 */
async function initializeApp() {
  let msalReady = false;

  if (isSSOConfigured()) {
    try {
      await msalInstance.initialize();
      msalReady = true;

      // Set active account if one exists
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }

      // Listen for login success events
      msalInstance.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          const account = event.payload.account;
          msalInstance.setActiveAccount(account);
        }
      });
    } catch (error) {
      console.error("MSAL initialization failed:", error);
    }
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      {msalReady ? (
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      ) : (
        <App />
      )}
    </React.StrictMode>
  );
}

initializeApp();
