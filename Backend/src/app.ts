import express from "express";
import userRouter from "./routers/user.router";
import authRouter from "./routers/auth.router";
import issueRouter from "./routers/issue.router";
import activityRouter from "./routers/activity.router";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error-handing";
import { generalLimiter } from "./middlewares/rate-limit.middleware";
import { AppError } from "./utils/app-error";

const app = express();

// Trust proxy for correct IP detection on platforms like Vercel/Render
app.set('trust proxy', 1);

// Allow multiple frontend URLs for development and production
const getAllowedOrigins = () => {
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(origin => origin.trim()).filter(Boolean)
    : [];

  return [
    'http://localhost:5173',      // Local development
    'http://localhost:3000',      // Alternative local dev
    ...envOrigins,                // Production frontend URLs from env
  ];
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // If no origin (like mobile apps or curl requests), allow it
    if (!origin) {
      return callback(null, true);
    }

    // Check against authorized origins
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.endsWith('.vercel.app') ||
                     origin.endsWith('.onrender.com');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      // Throw AppError to be caught by express error handler with 403 status
      callback(new AppError(403, 'CORS_REJECTED', `Origin ${origin} is not allowed by CORS policy`));
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

app.get("/api/v1/ping", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/issues", issueRouter);
app.use("/api/v1/activities", activityRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorHandler(err, req, res, next);
});

export default app;