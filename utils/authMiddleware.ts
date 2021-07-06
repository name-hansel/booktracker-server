import { RequestHandler, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { CustomRequest, TokenInterface } from "../interfaces";

const auth: RequestHandler = async (req: CustomRequest, res, next) => {
  if (!req.get("Authorization"))
    return res.status(401).json({ error: "No auth header supplied" });

  // Get access token
  const token = req.get("Authorization")!.split(" ")[1];

  // No token in header
  if (!token) return res.status(401).json({ error: "No token supplied" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenInterface;

    // Set user id in req
    req.id = decoded.user_id;

    // Go back to API route
    next();
  } catch (err) {
    // Access token has expired
    if (err.message === "jwt expired") {
      // Send back token
      const refreshToken = req.cookies["refresh-token"];
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET!
        ) as TokenInterface;

        // Sign new access token
        const payload = {
          user_id: decoded.user_id,
        };

        const accessToken = await jwt.sign(
          payload,
          process.env.ACCESS_TOKEN_SECRET!,
          {
            expiresIn: "6h",
          }
        );

        req.id = decoded.user_id;
        req.accessToken = accessToken;
        next();
      } catch (err) {
        console.error(err.message);
        // Refresh token has expired
        if (err.message === "jwt expired") {
          return res.status(401).json({
            error: "Refresh token has expired",
          });
        }
        return res.status(500).json({ error: "Server error" });
      }
    }
  }
};

export default auth;
