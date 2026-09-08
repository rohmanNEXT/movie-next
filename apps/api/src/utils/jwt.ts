import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config";

export const createToken = (payload: any, keepLogin: boolean = false) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: keepLogin ? "8h" : "1d",
  });
};


