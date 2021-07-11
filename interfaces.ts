import jwt from "jsonwebtoken";
import { Request } from "express";

export interface RegisterUser {
  username: string;
  email: string;
  password: string;
}

export interface CustomRequest extends Request {
  id?: string | jwt.JwtPayload;
  accessToken?: string;
}

export interface TokenInterface extends jwt.JwtPayload {
  user_id: string;
}

export interface Book {
  id: string;
  volumeInfo: {
    title: string;
    authors: string[];
    publishedDate: string;
    imageLinks: {
      thumbnail: string;
    };
  };
}
