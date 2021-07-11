import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDatabase from "./config/database";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import bookRouter from "./routes/books";

dotenv.config();
connectDatabase();
const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/book", bookRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Server is active on port ${PORT}`);
});
