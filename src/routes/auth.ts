import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();

let isConfigured = false;

function setupGoogleStrategy() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!clientID || !clientSecret || !jwtSecret) {
    console.error("\n❌ MISSING ENVIRONMENT VARIABLES:");
    if (!clientID) console.error("   - GOOGLE_CLIENT_ID");
    if (!clientSecret) console.error("   - GOOGLE_CLIENT_SECRET");
    if (!jwtSecret) console.error("   - JWT_SECRET");
    console.error("\n👉 Create backend/.env from .env.example and fill in all values.\n");
    return false;
  }

  const callbackURL = process.env.FRONTEND_URL?.includes("localhost")
    ? "http://localhost:4000/api/auth/google/callback"
    : `${process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL}/api/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"));

          let user = await prisma.user.findUnique({ where: { email } });

          const adminEmails = (process.env.ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);
          const isAdmin = adminEmails.includes(email);

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName,
                image: profile.photos?.[0]?.value,
                role: isAdmin ? "ADMIN" : "STUDENT",
                emailVerified: new Date(),
              },
            });
          }

          const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: "7d" }
          );

          done(null, { user, token });
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

  return true;
}

isConfigured = setupGoogleStrategy();

router.get("/google", (req, res, next) => {
  if (!isConfigured) {
    return res.status(500).json({
      error: "Google OAuth not configured",
      message: "Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or JWT_SECRET. Check your backend/.env file.",
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!isConfigured) {
    return res.status(500).json({ error: "Google OAuth not configured" });
  }
  passport.authenticate("google", { session: false })(req, res, next);
}, (req, res) => {
  const { token } = req.user as any;
  const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontend}/auth/callback?token=${token}`);
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: "JWT_SECRET not configured" });

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        enrollments: {
          include: { batch: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) return res.status(401).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;