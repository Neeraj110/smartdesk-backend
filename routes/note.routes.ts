import { Router } from "express";
import {
  summarienote,
  deletenote,
  getnotes,
} from "../controllers/note.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";

const router = Router();
router.use(authMiddleware);
router.post("/", upload.single("originalNote"), summarienote);
router.delete("/:id", deletenote);
router.get("/", getnotes);

export default router;
