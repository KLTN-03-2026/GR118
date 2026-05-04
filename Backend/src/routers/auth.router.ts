import { Router } from 'express';
import { register, login, logout, refreshToken, loginWithGoogle, getProfile } from '../modules/auth.controller/auth.controller';
import { sendOtp, verifyOtp, resetPasswordWithOtp } from '../modules/auth.controller/otp.controller';
import { SeedDemoData } from '../modules/auth.controller/seed.controller';
import isAuthenticated from '../middlewares/isAuthenticated';
import { authLimiter } from '../middlewares/rate-limit.middleware';
import { DeletePermission, GetActions, GetPermission, GetPermissions, GetResources, UpsertPermission } from '../modules/admin.controller/permission';
import { DeleteRole, UpdateRole, GetRoleById, GetRoles, UpsertRole } from '../modules/admin.controller/role';
import { AssignRoleToUser, CreateNewUser, GetUsers, GetUserById, LockOrUnlockUser, UpdateUser, DeleteUser } from '../modules/admin.controller/user';

const router = Router();

//user
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/loginGoogle", authLimiter, loginWithGoogle);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", isAuthenticated, getProfile);

// OTP
router.post("/otp/send", authLimiter, sendOtp);
router.post("/otp/verify", authLimiter, verifyOtp);
router.post("/otp/reset-password", authLimiter, resetPasswordWithOtp);
router.get("/seed", SeedDemoData);
router.post("/assign-roles", AssignRoleToUser);
router.post("/users", CreateNewUser);
router.get("/users", GetUsers);
router.get("/users/:id", GetUserById);
router.patch("/users/:id", UpdateUser);
router.post("/users/lockOrUnlock/:id", LockOrUnlockUser);

// permission
router.post("/permissions", UpsertPermission);
router.get("/permissions", GetPermissions);
// ⚠️  Specific paths MUST come before /:id — otherwise Express treats 'action'/'resources' as the id param
router.get("/permissions/action", GetActions);
router.get("/permissions/resources", GetResources);
router.get("/permissions/:id", GetPermission);
router.delete("/permissions/:id", DeletePermission);



//role
router.post("/role", UpsertRole);
router.get("/role", GetRoles);
router.get("/role/:id", GetRoleById);
router.delete("/role", DeleteRole);
router.patch("/role", UpdateRole);


// router
export default router;
