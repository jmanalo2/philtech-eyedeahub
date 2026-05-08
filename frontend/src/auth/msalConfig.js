/**
 * MSAL (Microsoft Authentication Library) configuration for Azure AD / Entra ID SSO.
 * 
 * Following the same pattern as Albertsons internal apps (SDIM Impact, etc.)
 * 
 * Required environment variables:
 * - REACT_APP_AZURE_CLIENT_ID: Azure AD Application (Client) ID
 * - REACT_APP_AZURE_TENANT_ID: Azure AD Tenant ID
 * - REACT_APP_AZURE_REDIRECT_URI: Redirect URI after login (default: window origin)
 */

import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

const clientId = process.env.REACT_APP_AZURE_CLIENT_ID || '';
const tenantId = process.env.REACT_APP_AZURE_TENANT_ID || '';
const redirectUri = process.env.REACT_APP_AZURE_REDIRECT_URI || window.location.origin;
const postLogoutRedirectUri = process.env.REACT_APP_AZURE_POST_LOGOUT_REDIRECT_URI || window.location.origin;

/**
 * MSAL Configuration
 */
export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage', // More secure than localStorage
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.info(message);
            }
            break;
          default:
            break;
        }
      },
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Warning : LogLevel.Error,
    },
  },
};

/**
 * Scopes to request during login.
 * - openid: Required for ID token
 * - profile: User's name, etc.
 * - email: User's email address
 * - User.Read: Read user profile from MS Graph (optional)
 */
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

/**
 * Scopes for acquiring tokens silently (for API calls).
 */
export const tokenRequest = {
  scopes: [`api://${clientId}/access_as_user`],
};

/**
 * Create and initialize the MSAL instance.
 * Must be initialized before the app renders.
 */
export const msalInstance = new PublicClientApplication(msalConfig);

/**
 * Check if SSO is configured (has valid client ID and tenant ID)
 */
export const isSSOConfigured = () => {
  return Boolean(clientId && tenantId && clientId !== 'YOUR_CLIENT_ID_HERE');
};
