import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import propertiesRoutes from "./routes/properties.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import verifyRoutes from "./routes/verify.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verify", verifyRoutes);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "NSS DirectStay Backend API" });
});

app.listen(PORT, () => {
  console.log(`🚀 NSS DirectStay Backend Server running on http://localhost:${PORT}`);
});
