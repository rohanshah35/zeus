import fs from "node:fs";
import path from "node:path";
import { optionalNumberEnv } from "./env.js";

function readPortfolioTickers() {
  const configuredPath = process.env.PORTFOLIO_TICKERS_FILE || "portfolio-tickers.txt";
  const resolvedPath = path.resolve(process.cwd(), configuredPath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      filePath: resolvedPath,
      tickers: []
    };
  }

  const tickers = fs
    .readFileSync(resolvedPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.endsWith(":"))
    .map((line) => line.toUpperCase());

  return {
    filePath: resolvedPath,
    tickers: Array.from(new Set(tickers))
  };
}

export function getConfig() {
  const portfolio = readPortfolioTickers();

  return {
    timezone: process.env.MORNING_BRIEF_TIMEZONE || "America/New_York",
    newsLookbackHours: optionalNumberEnv("MORNING_BRIEF_NEWS_LOOKBACK_HOURS", 24),
    portfolio
  };
}
