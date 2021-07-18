import * as express from "express";
const router = express.Router();
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User";
import Library from "../models/Library";
import redis from "../config/redis";
import { RegisterUser } from "../interfaces";
import {
  registrationValidation,
  loginValidation,
  resetPassword,
} from "../utils/validation";
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
      return res.status(400).json({
        error: "Username already exists. Please choose another username.",
      });

    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({
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
    const html = `<p>Click on the link given below to verify your Booktracker account</p>
    <a href='http://localhost:3000/verify/${emailHash}'>Verify account</a>`;

    const subject = "Booktracker Account Validation";
    sendEmail(email, html, subject);

    // Save the hash in redis along with userid
    await redis.set(emailHash, _id.toString(), "ex", 60 * 60 * 24);

    // Create library
    const library = new Library({ user: _id });
    await library.save();

    return res.status(200).json({
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

// @route   POST /auth/resend-verification
// @desc    Resend verification link
// @access  Public
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email }).select("-password");

    // No account with email found
    if (!user)
      return res.status(400).json({
        message: "Some error has occurred",
      });

    // Account already activated
    if (user.activated)
      return res.status(400).json({
        message: "Account is already active",
      });

    const emailHash = crypto
      .createHash("md5")
      .update(user._id.toString())
      .digest("hex");

    // Send email for activation
    const html = `<p>Click on the link given below to verify your Booktracker account</p>
    <a href='http://localhost:3000/verify/${emailHash}'>Verify account</a>`;

    const subject = "Booktracker Account Validation";
    sendEmail(email, html, subject);

    // Save the hash in redis along with userid
    await redis.set(emailHash, user._id.toString(), "ex", 60 * 60 * 24);

    return res.status(200).json({
      message: "Email containing link for account activation has been sent!",
    });
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

    // Set loggedIn as true
    user.loggedIn = true;
    await user.save();

    const options = {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 5,
    };

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

// @route   POST /auth/forgot-password
// @desc    Send email containing link to reset password
// @access  Public
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email }).select("_id");
    if (!user)
      return res.status(400).json({ error: "Some error has occurred" });

    // Create hash to save in redis
    const hash = crypto
      .createHash("md5")
      .update(user._id.toString())
      .digest("hex");

    // Save the hash in redis along with userid
    await redis.set(
      `${process.env.FORGOT_PASSWORD}:${hash}`,
      user._id.toString(),
      "ex",
      60 * 60 * 15
    );

    // Send email to reset password
    const html = `<p>Click on the link given below to reset your Booktracker password</p>
    <a href='http://localhost:3000/reset-password/${hash}'>Reset password</a>`;
    const subject = "Reset Password for your Booktracker Account";
    sendEmail(email, html, subject);

    return res.status(200).json({
      message: "Email containing link to reset password has been sent!",
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /auth/reset-password
// @desc    Reset password
// @access  Public
router.post("/reset-password/:hash", resetPassword, async (req, res) => {
  const hash = req.params.hash;
  const { password } = req.body;
  try {
    // Get the user id from hash
    const id = await redis.get(`${process.env.FORGOT_PASSWORD}:${hash}`);
    if (!id)
      return res.status(400).json({
        error: "Invalid or expired link",
      });

    // Get current password
    const user = await User.findOne({ _id: id }).select("email password");
    const match = await bcrypt.compare(password, user.password);

    // Same password
    if (match)
      return res
        .status(400)
        .json({ error: "New password cannot be same as old password" });

    // Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.findOneAndUpdate(
      { _id: id },
      { password: hashedPassword, loggedIn: false },
      { new: true }
    );

    await redis.del(`${process.env.FORGOT_PASSWORD}:${hash}`);

    let date = new Date();

    // Send email that password has been changed
    const html = `<p>Password for your Booktracker account was changed at ${date.toLocaleTimeString()} ${date.toLocaleDateString()}</p>`;

    const subject = "Booktracker Account Changes";
    sendEmail(user.email, html, subject);

    return res.status(200).json({
      message: "Password has been reset successfully! Redirecting to login...",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

// @route   GET /auth/logout
// @desc    Set cookie to none
// @access  Public
router.post("/logout", (req, res) => {
  res.cookie("refresh-token", "", {
    httpOnly: true,
    expires: new Date(),
  });
  return res.status(200).json({
    message: "User logged out successfully!",
  });
});

export default router;
