import jwt from "jsonwebtoken";
import env from "../config/env.js";

const getJwtSecret = () => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured in environment variables");
  }
  return env.jwtSecret;
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tv: user.tokenVersion ?? 0,
    },
    getJwtSecret(),
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

export const getCookieOptions = () => {
  const isCrossSiteHttps =
    env.nodeEnv === "production" ||
    env.isRender ||
    env.frontendUrl.startsWith("https://");

  return {
    httpOnly: true,
    secure: isCrossSiteHttps,
    sameSite: isCrossSiteHttps ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: "/",
  };
};

export const setAuthCookie = (res, token) => {
  res.cookie(env.cookieName, token, getCookieOptions());
};

export const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  delete options.maxAge;
  res.clearCookie(env.cookieName, options);
};
