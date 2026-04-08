import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { HomePage } from "./pages/HomePage";
import { ReportPage } from "./pages/ReportPage";
import { DashboardPage } from "./pages/DashboardPage";
import { IssuesPage } from "./pages/IssuesPage";
import { IssueDetailPage } from "./pages/IssueDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminManagementPage } from "./pages/AdminManagementPage";
import { MyReportsPage } from "./pages/MyReportsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminVerificationsPage } from "./pages/AdminVerificationsPage";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { ActivityDetailPage } from "./pages/ActivityDetailPage";
import { MyActivitiesPage } from "./pages/MyActivitiesPage";
import { ModeratorActivitiesPage } from "./pages/ModeratorActivitiesPage";
import { ModeratorIssuesPage } from "./pages/ModeratorIssuesPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { PermissionDetailPage } from "./pages/PermissionDetailPage";
import { RolesPage } from "./pages/RolesPage";
import { RoleDetailPage } from "./pages/RoleDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "report", Component: ReportPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "issues", Component: IssuesPage },
      { path: "issues/:id", Component: IssueDetailPage },
      { path: "profile", Component: ProfilePage },
      { path: "admin", Component: AdminManagementPage },
      { path: "admin/users", Component: AdminUsersPage },
      { path: "admin/verifications", Component: AdminVerificationsPage },
      { path: "admin/permissions", Component: PermissionsPage },
      { path: "admin/permissions/:id", Component: PermissionDetailPage },
      { path: "admin/roles", Component: RolesPage },
      { path: "admin/roles/:id", Component: RoleDetailPage },
      { path: "my-reports", Component: MyReportsPage },
      { path: "activities", Component: ActivitiesPage },
      { path: "activities/:id", Component: ActivityDetailPage },
      { path: "activities/my-activities", Component: MyActivitiesPage },
      { path: "moderator/activities", Component: ModeratorActivitiesPage },
      { path: "moderator/issues", Component: ModeratorIssuesPage },
      { path: "statistics", Component: StatisticsPage },
    ],
  },
]);