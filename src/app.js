import express from "express";
import cors from "cors";

import authModule from "./modules/auth/auth.module.js";
import usersModule from "./modules/users/users.module.js";
import onboardingModule from "./modules/onboarding/onboarding.module.js";
import universitiesModule from "./modules/universities/universities.module.js";
import shortlistModule from "./modules/shortlist/shortlist.module.js";
import lockModule from "./modules/lock/lock.module.js";
import tasksModule from "./modules/tasks/tasks.module.js";
import counsellorModule from "./modules/counsellor/counsellor.module.js";


const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/auth", authModule);
app.use("/api/users", usersModule);
app.use("/api/onboarding", onboardingModule);
app.use("/api/universities", universitiesModule);
app.use("/api/shortlist", shortlistModule);
app.use("/api/lock", lockModule);
app.use("/api/tasks", tasksModule);
app.use("/api/counsellor", counsellorModule);

// health check (optional but useful)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
