// Route for protected resources regarding user
import { Router, Response } from "express";
import bcrypt from "bcrypt";
const router = Router();

import User from "../models/User";
import auth from "../utils/authMiddleware";
import { CustomRequest } from "../interfaces";
import { changePassword } from "../utils/validation";

// @route   GET /user
// @desc    Get current user's profile
// @access  Private
router.get("/", auth, async (req: CustomRequest, res: Response) => {
  try {
    // Get user by id
    const user = await User.findOne({ _id: req.id }).select("_id username");

    // No user found with id
    if (!user) return res.status(401).json({ error: "Account not found" });

    if (req.accessToken)
      return res.status(200).json({
        user,
        accessToken: req.accessToken,
      });

    return res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

// @route   POST /user/change-password
// @desc    Change current user's password
// @access  Private
router.post(
  "/change-password",
  [auth, changePassword],
  async (req: CustomRequest, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;

      // Get password
      const user = await User.findOne({ _id: req.id });
      const match = await bcrypt.compare(oldPassword, user.password);

      // Old password does not match
      if (!match)
        return res.status(400).json({ error: "Invalid old password" });

      // Encrypt the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.loggedIn = false;
      await user.save();

      return res
        .status(200)
        .json({ message: "Password changed successfully!" });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

export default router;
