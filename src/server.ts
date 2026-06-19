import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import passport from "passport";

import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth";
import batchRoutes from "./routes/batches";
import dayRoutes from "./routes/days";
import submissionRoutes from "./routes/submissions";
import adminRoutes from "./routes/admin";
import leaderboardRoutes from "./routes/leaderboard";
import enrollmentRoutes from "./routes/enrollments";
import userRoutes from "./routes/users";
import chatRoutes from "./routes/chat";
import uploadRoutes from "./routes/upload";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL!,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL!,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/days", dayRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);

// Serve uploaded files statically (allow cross-origin for images)
app.use("/uploads", (req, res, next) => {
  res.removeHeader("Cross-Origin-Resource-Policy");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(process.cwd(), "uploads")));

// Socket.io for live chat
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-batch", (batchId: string) => {
    socket.join(batchId);
    console.log(`Socket ${socket.id} joined batch ${batchId}`);
  });

  socket.on("leave-batch", (batchId: string) => {
    socket.leave(batchId);
  });

  socket.on("send-message", async (data: { batchId: string; userId: string; content: string }) => {
    try {
      const { batchId, userId, content } = data;

      // Verify enrollment
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      const enrollment = await prisma.enrollment.findFirst({
        where: { userId, batchId },
      });

      if (!enrollment && user.role !== "ADMIN") return;

      const message = await prisma.message.create({
        data: { batchId, userId, content: content.trim() },
        include: { user: { select: { id: true, name: true, image: true } } },
      });

      io.to(batchId).emit("new-message", message);
    } catch (err) {
      console.error("Chat error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: ${process.env.FRONTEND_URL}`);
});
