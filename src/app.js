import express from "express";
import cors from "cors";

import authModule from "./modules/auth/auth.module.js";
import usersModule from "./modules/users/users.module.js";
import onboardingModule from "./modules/onboarding/onboarding.module.js";

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/auth", authModule);
app.use("/api/users", usersModule);
app.use("/api/onboarding", onboardingModule);

// health check (optional but useful)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
