import express from "express";
const router = express.Router();

import { CustomRequest } from "../interfaces";
import auth from "../utils/authMiddleware";
import Library from "../models/Library";

// @route   GET /library/:id
// @desc    Get library by userid
// @access  Private
router.get("/:userId", auth, async (req: CustomRequest, res) => {
  const userId = req.params.userId;
  try {
    const { user, books } = await Library.findOne({ user: userId });

    if (req.id && req.id != user)
      return res.status(403).json({
        error: "Forbidden resource",
      });

    if (req.accessToken)
      return res.status(200).json({
        library: books,
        accessToken: req.accessToken,
      });

    return res.status(200).json({
      library: books,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;
