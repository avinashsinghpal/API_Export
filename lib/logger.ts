import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "apiKey",
      "encryptedKey",
      "token",
      "refreshToken",
      "accessToken",
      "emailBody",
    ],
    remove: false,
    censor: "[REDACTED]",
  },
  base: {
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
