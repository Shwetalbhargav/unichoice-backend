// src/modules/users/users.controller.js

import { getUserById } from "./users.service.js";
import { success } from "../../utils/response.js";

export const getMe = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return success(res, "User fetched", user);
  } catch (err) {
    next(err);
  }
};
