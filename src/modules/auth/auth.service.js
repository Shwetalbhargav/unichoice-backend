// src/modules/auth/auth.service.js

import prisma from "../../config/db.js";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const findUserByMobile = async (mobile) => {
  return prisma.user.findUnique({
    where: { mobile },
  });
};

export const createUser = async ({ name, mobile }) => {
  return prisma.user.create({
    data: {
      name: name || "User",
      mobile,
      isOnboarded: false,
    },
  });
};

export const findOrCreateUser = async ({ name, mobile }) => {
  let user = await findUserByMobile(mobile);

  if (!user) {
    user = await createUser({ name, mobile });
  }

  return user;
};

export const generateToken = (user) => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET missing in environment variables");
  }

  return jwt.sign(
    { id: user.id, mobile: user.mobile },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};
