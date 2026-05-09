import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { IssuesProvider } from "./context/IssuesContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ActivitiesProvider } from "./context/ActivitiesContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { RolesProvider } from "./context/RolesContext";
import { ServerKeepAlive } from "./components/ServerKeepAlive";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = (import.meta as ImportMeta & {
  env: { VITE_GOOGLE_CLIENT_ID: string };
}).env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <IssuesProvider>
          <NotificationProvider>
            <ActivitiesProvider>
              <PermissionsProvider>
                <RolesProvider>
                  <ServerKeepAlive />
                  <RouterProvider router={router} />
                </RolesProvider>
              </PermissionsProvider>
            </ActivitiesProvider>
          </NotificationProvider>
        </IssuesProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}