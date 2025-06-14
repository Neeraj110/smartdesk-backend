import { Router } from "express";
import {
  forgetPassword,
  getCurrentUser,
  googleLogin,
  login,
  logout,
  register,
  updateUser,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { getStats } from "../controllers/stats.controller";

const router = Router();

router.post("/google-login", googleLogin);
router.post("/login", login);
router.post("/register", register);
router.post("/reset-password", forgetPassword);

router.use(authMiddleware);
router.get("/current-user", getCurrentUser);
router.post("/logout", logout);
router.patch("/update-profile", updateUser);
router.get("/stats", getStats);

export default router;
