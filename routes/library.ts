import express from "express";
const router = express.Router();

import { CustomRequest } from "../interfaces";
import auth from "../utils/authMiddleware";
import Library from "../models/Library";

// @route   GET /library
// @desc    Get library by userid
// @access  Private
router.get("/", auth, async (req: CustomRequest, res) => {
  try {
    const { user, books } = await Library.findOne({ user: req.id });

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

// @route   POST /library/add/:bookId
// @desc    Add book to library
// @access  Private
router.post("/:bookId", auth, async (req: CustomRequest, res) => {
  const { googleBooksId, title, authors, imageURL } = req.body;
  const book = {
    googleBooksId,
    title,
    authors,
    imageURL,
  };
  try {
    const library = await Library.findOne({ user: req.id });
    library.books.unshift(book);
    await library.save();

    res.status(200).json({
      message: "Added book to your library!",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;
