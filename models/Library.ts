import mongoose from "mongoose";
import { User } from "./User";

interface Library {
  user: User["_id"];
  books: [
    {
      googleBooksId: string;
      title: string;
      authors: string[];
      imageURL: string;
      addedAt: Date;
    }
  ];
}

const librarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  books: [
    {
      googleBooksId: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      authors: {
        type: [String],
        required: true,
      },
      imageURL: {
        type: String,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Library = mongoose.model("library", librarySchema);

export default Library;
