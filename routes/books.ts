import * as express from "express";
import axios from "axios";

const router = express.Router();
import { Book } from "../interfaces";
import { bookClient } from "../config/redis";

// @route   GET /book/search?term=hunger+games&number=5
// @desc    Search for books
// @access  Public
router.get("/search", async (req, res) => {
  const term = req.query.term?.toString();
  const number = req.query.number ? req.query.number : 5;
  if (!term)
    return res.status(400).json({
      error: "Please enter a search term",
    });

  // Check if present in cache
  const data = await bookClient.get(term);
  if (data !== null)
    return res.status(200).json({
      books: JSON.parse(data),
    });

  try {
    const {
      data: { items },
    } = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${term}&maxResults=${number}&key=${process.env.GOOGLE_BOOKS_KEY}`
    );

    const books = items.map((book: Book) => {
      const url = book.volumeInfo.imageLinks
        ? book.volumeInfo.imageLinks.thumbnail
        : "";
      return {
        id: book.id,
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors,
        date: book.volumeInfo.publishedDate,
        imageURL: url,
      };
    });

    // Set cache
    bookClient.setex(term, 60 * 60 * 24 * 5, JSON.stringify(books));
    return res.status(200).json({
      books,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server Error",
    });
  }
});

// @route   GET /book/search/:id
// @desc    Search for book by id
// @access  Public
router.get("/search/:id", async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({
      error: "No id specified",
    });

  // Check if present in cache
  const data = await bookClient.get(id);
  if (data !== null) return res.status(200).json(JSON.parse(data));

  try {
    const {
      data: {
        volumeInfo: {
          title,
          subtitle,
          authors,
          publisher,
          publishedDate,
          description,
          pageCount,
          categories,
          averageRating,
          ratingsCount,
          imageLinks,
        },
      },
    } = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${id}?key=${process.env.GOOGLE_BOOKS_KEY}`
    );

    const book = {
      title,
      subtitle: subtitle ? subtitle : "",
      authors,
      publisher,
      publishedDate,
      description,
      pageCount,
      categories,
      averageRating,
      ratingsCount,
      imageUrl: imageLinks ? imageLinks.thumbnail : "",
    };

    // Set cache
    bookClient.setex(id, 60 * 60 * 24 * 5, JSON.stringify(book));
    return res.status(200).json(book);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;
