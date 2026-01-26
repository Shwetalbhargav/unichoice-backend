// src/modules/auth/auth.controller.js

import * as authService from "./auth.service.js";

export const sendOtp = async (req, res) => {
  const { name, mobile } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ message: "Name and mobile are required" });
  }

  // Mock OTP
  return res.json({
    success: true,
    message: "OTP sent successfully (mock)",
    otp: "123456",
  });
};

export const verifyOtp = async (req, res) => {
  const { mobile, otp, name } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile and OTP are required" });
  }

  if (otp !== "123456") {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const user = await authService.findOrCreateUser({ name, mobile });
  const token = authService.generateToken(user);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      isOnboarded: user.isOnboarded,
    },
  });
};
