import express from "express";
import userRouter from "./routers/user.router";
import authRouter from "./routers/auth.router";
import issueRouter from "./routers/issue.router";
import activityRouter from "./routers/activity.router";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error-handing";
import { generalLimiter } from "./middlewares/rate-limit.middleware";

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(generalLimiter);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API running...");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/issues", issueRouter);
app.use("/api/v1/activities", activityRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorHandler(err, req, res, next);
});

export default app;