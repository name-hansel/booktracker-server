import * as express from "express";
const router = express.Router();
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User";
import redis from "../config/redis";
import { RegisterUser, CustomRequest } from "../interfaces";
import { registrationValidation, loginValidation } from "../utils/validation";
import { sendEmail } from "../utils/nodemailer";

// @route   POST /auth/register
// @desc    Create new account
// @access  Public
router.post("/register", async (req, res) => {
  const { email, username, password }: RegisterUser = req.body;

  // Check if correct form
  const error = registrationValidation({ username, email, password });
  if (error)
    return res.status(401).json({
      error,
    });

  try {
    // Check if username exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).send({
        error: "Please choose another username",
      });

    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).send({
        error: "Some error has occurred",
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
    await redis.set(emailHash, _id.toString(), "ex", 60 * 60 * 24);

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

// @route   GET /auth/verify/:hash
// @desc    Verify account
// @access  Public
router.get("/verify/:hash", async (req, res) => {
  const hash = req.params.hash;
  try {
    const id = await redis.get(hash.toString());
    if (!id)
      return res.status(400).json({
        error: "Account not found",
      });

    await User.findOneAndUpdate(
      { _id: id },
      { activated: true },
      { new: true }
    );
    await redis.del(hash);

    return res.status(200).json({
      message: "Account has been activated",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

// @route   POST /auth/login
// @desc    Login user, send access token and set cookie
// @access  Public
router.post("/login", loginValidation, async (req, res) => {
  try {
    // Get data from form
    const finder = req.body.email
      ? { key: "email", value: req.body.email }
      : { key: "username", value: req.body.username };
    const password = req.body.password;

    // Find user in database by email or username
    const user =
      finder.key === "email"
        ? await User.findOne({ email: finder.value })
        : await User.findOne({ username: finder.value });

    // No user with those credentials exists
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    if (!user.activated)
      return res.status(401).json({ error: "Account has not been activated." });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const payload = {
      user_id: user._id,
    };

    const accessToken = await jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: "6h",
      }
    );

    const refreshToken = await jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "5 days",
      }
    );

    const options = {
      httpOnly: true,
    };

    // Set loggedIn as true
    user.loggedIn = true;
    await user.save();

    // Set cookie
    res.cookie("refresh-token", refreshToken, options);

    // Send accessToken
    return res.status(200).json({
      token: accessToken,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;
