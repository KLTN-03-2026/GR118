import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { IssuesProvider } from "./context/IssuesContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ActivitiesProvider } from "./context/ActivitiesContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { RolesProvider } from "./context/RolesContext";
import { ServerKeepAlive } from "./components/ServerKeepAlive";

export default function App() {
  return (
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
  );
}