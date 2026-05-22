import { Router } from 'express';
import { register, login, logout, refreshToken, loginWithGoogle, getProfile, updateProfile, TestEmail } from '../modules/auth.controller/auth.controller';
import { sendOtp, verifyOtp, resetPasswordWithOtp } from '../modules/auth.controller/otp.controller';
import { SeedDemoData } from '../modules/auth.controller/seed.controller';
import isAuthenticated from '../middlewares/isAuthenticated';
import { authLimiter } from '../middlewares/rate-limit.middleware';
import { DeletePermission, GetActions, GetPermission, GetPermissions, GetResources, UpsertPermission } from '../modules/admin.controller/permission';
import { DeleteRole, UpdateRole, GetRoleById, GetRoles, UpsertRole } from '../modules/admin.controller/role';
import { AssignRoleToUser, CreateNewUser, GetUsers, GetUserById, LockOrUnlockUser, UpdateUser, DeleteUser } from '../modules/admin.controller/user';
import { GetStats } from '../modules/admin.controller/stats';
import { sendAccountCreationEmail } from '../utils/email.service';

const router = Router();

//user
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/loginGoogle", authLimiter, loginWithGoogle);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", isAuthenticated, getProfile);
router.patch("/profile", isAuthenticated, updateProfile);
router.get("/stats", isAuthenticated, GetStats);
router.get("/test-email", TestEmail);

// OTP
router.post("/otp/send", authLimiter, sendOtp);
router.post("/otp/verify", authLimiter, verifyOtp);
router.post("/otp/reset-password", authLimiter, resetPasswordWithOtp);
router.get("/seed", SeedDemoData);
router.post("/assign-roles", isAuthenticated, AssignRoleToUser);
router.post("/users", isAuthenticated, CreateNewUser);
router.get("/users", isAuthenticated, GetUsers);
router.get("/users/:id", isAuthenticated, GetUserById);
router.patch("/users/:id", isAuthenticated, UpdateUser);
router.post("/users/lockOrUnlock/:id", isAuthenticated, LockOrUnlockUser);
router.delete("/users", isAuthenticated, DeleteUser); // Support ?id=...
router.delete("/users/:id", isAuthenticated, DeleteUser); // Support /:id

// permission
router.post("/permissions", isAuthenticated, UpsertPermission);
router.get("/permissions", isAuthenticated, GetPermissions);
router.get("/permissions/action", isAuthenticated, GetActions);
router.get("/permissions/resources", isAuthenticated, GetResources);
router.get("/permissions/:id", isAuthenticated, GetPermission);
router.delete("/permissions/:id", isAuthenticated, DeletePermission);



//role
router.post("/role", isAuthenticated, UpsertRole);
router.get("/role", isAuthenticated, GetRoles);
router.get("/role/:id", isAuthenticated, GetRoleById);
router.delete("/role", isAuthenticated, DeleteRole);
router.patch("/role", isAuthenticated, UpdateRole);


// router
export default router;
