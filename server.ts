import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDatabase from "./config/database";
import authRouter from "./routes/auth";

dotenv.config();
connectDatabase();
const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Server is active on port ${PORT}`);
});