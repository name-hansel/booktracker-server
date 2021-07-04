import * as express from "express";
const router = express.Router();

import { RegisterUser } from "../interfaces";

router.post("/register", (req, res) => {
  const { email, username, password }: RegisterUser = req.body;
});

router.get("/", (req, res) => {
  res.send("Auth");
});

export default router;
