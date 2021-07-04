import * as express from "express";
const router = express.Router();
import bcrypt from "bcrypt";
import crypto from "crypto";

import { RegisterUser } from "../interfaces";
import { registrationValidation } from "../utils/validation";
import User from "../models/User";
import redisClient from "../config/redis";

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
    console.log(typeof _id);
    const emailHash = crypto
      .createHash("md5")
      .update(_id.toString())
      .digest("hex");

    // Send email for activation

    // Save the hash in redis along with userid
    redisClient.hmset(
      _id.toString(),
      ["emailHash", emailHash],
      function (err, reply) {
        if (err) {
          console.log(err);
        }
        console.log(reply);
      }
    );

    return res.status(200).json({
      id: _id,
      message: "Email containing link for account activation has been sent!",
    });
  } catch (err) {
    console.error(err.trace);
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

router.get("/:id", async (req, res) => {
  redisClient.hgetall(req.params.id, function (err, obj) {
    if (!obj) {
      console.log("not found");
    } else {
      console.log(obj.emailHash);
    }
  });
  return res.status(200);
});

export default router;
