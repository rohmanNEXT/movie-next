import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const createToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1d",
  });
};


