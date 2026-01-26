import express from "express";
import cors from "cors";

import authModule from "./modules/auth/auth.module.js";

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/auth", authModule);

// health check (optional but useful)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
