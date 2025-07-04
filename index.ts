import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/indexDB";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import taskRouter from "./routes/task.routes";
import noteRouter from "./routes/note.routes";
import AiLearningRouter from "./routes/ai.routes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
connectDB();
const url = process.env.CLIENT_URL!;
if (!url) {
  throw new Error("CLIENT_URL is not defined in .env file");
}
app.use(
  cors({
    origin: url,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/ai", AiLearningRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
