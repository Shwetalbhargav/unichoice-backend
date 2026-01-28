// src/modules/users/users.service.js

import prisma from "../../config/db.js";

export const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      mobile: true,      
      isOnboarded: true,
      createdAt: true,
      profile: true,
    },
  });
};
