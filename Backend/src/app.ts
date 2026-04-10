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

// Allow multiple frontend URLs for development and production
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:5173',      // Local development
    'http://localhost:3000',      // Alternative local dev
    process.env.FRONTEND_URL,     // Production frontend URL from env
  ].filter(Boolean);
  
  return origins;
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(generalLimiter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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