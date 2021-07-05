import * as express from "express";
const router = express.Router();
import bcrypt from "bcrypt";
import crypto from "crypto";

import { RegisterUser } from "../interfaces";
import { registrationValidation } from "../utils/validation";
import User from "../models/User";
import redis from "../config/redis";
import { sendEmail } from "../utils/nodemailer";

router.post("/register", async (req, res) => {
  const { email, username, password }: RegisterUser = req.body;

  // Check if correct form
  const error = registrationValidation({ username, email, password });
  if (error)
    return res.status(401).json({
      error,
    });

  try {
    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).send({
        error: "Some error has occurred",
      });

    // Check if username exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).send({
        message: "Please choose another username",
      });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    const { _id } = await user.save();

    const emailHash = crypto
      .createHash("md5")
      .update(_id.toString())
      .digest("hex");

    // Send email for activation
    sendEmail(email, emailHash);

    // Save the hash in redis along with userid
    await redis.set(emailHash, _id.toString());

    return res.status(200).json({
      id: _id,
      message: "Email containing link for account activation has been sent!",
    });

    // Catch
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

router.get("/verify/:hash", async (req, res) => {
  const hash = req.params.hash;
  try {
    const id = await redis.get(hash);
    // id is userid
  } catch (err) {
    console.error(err.message);
  }
});

export default router;
