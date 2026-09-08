import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const createToken = (payload: any, keepLogin: boolean = false) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: keepLogin ? "8h" : "1d",
  });
};


