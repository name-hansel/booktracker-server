import { RequestHandler } from "express";

import { RegisterUser } from "../interfaces";

export const registrationValidation = ({
  username,
  email,
  password,
}: RegisterUser) => {
  if (!username || username.length < 6 || username.length > 32)
    return "Invalid username";
  if (
    !email ||
    !email.match(
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    )
  )
    return "Invalid email";
  if (
    !password ||
    !password.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/)
  )
    return "Invalid password type. Must contain minimum eight characters, at least one letter and one number.";
};

export const loginValidation: RequestHandler = (req, res, next) => {
  if (!req.body.username && !req.body.email)
    return res.status(400).json({
      error: "Enter a valid username or email",
    });
  if (!req.body.password)
    return res.status(400).json({
      error: "Enter a valid password",
    });
  next();
};
