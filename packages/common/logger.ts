import winston from "winston";
import colors from "colors/safe";

// Define log level colors
const levelColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
  silly: "grey",
} as const;

// Define a type for the color functions in colors/safe
type ColorFunction = (text: string) => string;

// Create custom format with colors
const customFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    const levelLower = level.toLowerCase() as keyof typeof levelColors;
    const colorName = levelColors[levelLower] || "white";
    const colorizer = (colors as unknown as Record<string, ColorFunction>)[
      colorName
    ];
    const paddedLevel = level.padEnd(7);
    const coloredLevel = colorizer(paddedLevel);
    const metadataStr = Object.keys(metadata).length
      ? "\n" + JSON.stringify(metadata, null, 2)
      : "";

    return `${timestamp} ${coloredLevel}: ${message}${metadataStr}`;
  }
);

// Create and configure the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

export default logger;
