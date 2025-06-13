import { Router } from "express";
import {
  createAiLearning,
  getUserLearningGuides,
  getLearningGuide,
  deleteLearningGuide,
  deleteAllUserLearningGuides,
} from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createAiLearning);
router.get("/", getUserLearningGuides);
router.get("/:id", getLearningGuide);
router.delete("/:id", deleteLearningGuide);
router.delete("/user/all", deleteAllUserLearningGuides);

export default router;
