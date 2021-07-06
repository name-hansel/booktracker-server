// Route for protected resources regarding user
import { Router, Response, NextFunction } from "express";
const router = Router();

import User from "../models/User";
import auth from "../utils/authMiddleware";
import { CustomRequest } from "../interfaces";

// @route   GET /auth/user
// @desc    Get current user's profile
// @access  Private
router.get("/", auth, async (req: CustomRequest, res) => {
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

export default router;
