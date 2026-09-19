import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import metaRouter from "./routes/meta.js";
import categoriesRouter from "./routes/categories.js";
import tagsRouter from "./routes/tags.js";
import adminsRouter from "./routes/admins.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.FRONTEND_URL?.split(",").map(value => value.trim()) || "http://localhost:5173"
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "🚀 CMS API running 👍" });
});

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/admins", adminsRouter);
app.use("/api/meta", metaRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(port, () => {
  console.log(`🚀 CMS API running on port ${port}`);
});
