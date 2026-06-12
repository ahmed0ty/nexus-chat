import { createLogger, format, transports } from "winston";
import path from "path";

const { combine, timestamp, colorize, printf, errors, json } = format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), consoleFormat),
    }),
    new transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: combine(timestamp(), json()),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join("logs", "combined.log"),
      format: combine(timestamp(), json()),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join("logs", "exceptions.log") }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join("logs", "rejections.log") }),
  ],
});