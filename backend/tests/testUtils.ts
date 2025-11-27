import jwt from "jsonwebtoken";

export function generateTestToken(payload: object = { userId: 1 }) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

export function generateExpiredTestToken(payload: object = { userId: 1 }) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn: "-1s" }); // Already expired
}

export const TEST_USER_PAYLOAD = {
  userId: 1,
  email: "test@example.com",
  role: "USER",
};

export const TEST_ADMIN_PAYLOAD = {
  userId: 2,
  email: "admin@example.com",
  role: "ADMIN",
};
