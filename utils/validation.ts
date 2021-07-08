import { RequestHandler } from "express";

import { RegisterUser } from "../interfaces";

export const registrationValidation = ({
  username,
  email,
  password,
}: RegisterUser) => {
  if (
    !username ||
    username.length < 6 ||
    username.length > 32 ||
    !username.match(/^(?=[a-zA-Z0-9._]{6,32}$)(?!.*[_.]{2})[^_].*[^_.]$/)
  )
    return "Username can contain only letter, number and underscore. Length should be between 6 and 32.";
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

export const resetPassword: RequestHandler = (req, res, next) => {
  if (
    !req.body.password ||
    !req.body.password.match(
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/
    )
  )
    return res.status(400).json({ error: "Enter a valid password" });
  next();
};

export const changePassword: RequestHandler = (req, res, next) => {
  if (!req.body.oldPassword)
    return res.status(400).json({ error: "Invalid old password" });

  if (
    !req.body.newPassword ||
    !req.body.newPassword.match(
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/
    )
  )
    return res.status(400).json({ error: "Invalid new password" });
  if (req.body.oldPassword === req.body.newPassword)
    return res
      .status(400)
      .json({ error: "New password cannot be same as old password" });

  next();
};
