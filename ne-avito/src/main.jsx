import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from "react-oidc-context";
import App from './App.jsx'
import './index.css'

const oidcConfig = {
  authority: "http://localhost:8080/api/auth/realms/test",
  client_id: "frontend",
  redirect_uri: "http://localhost:5173/",
  scope: "openid email profile",
  response_type: "code",
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider {...oidcConfig}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
