import readline from "node:readline";
import { loadEnv } from "./env.js";
import { getConfig } from "./config.js";
import { fetchNewsByCategory, fetchPortfolioNews } from "./rss.js";

loadEnv();

const config = getConfig();

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function formatNewsSection(title, news) {
  const lines = [`${title}:`];

  if (news.errors?.length) {
    lines.push(`Errors: ${news.errors.join(" | ")}`);
  }

  if (!news.items?.length) {
    lines.push("No items found.");
    return lines.join("\n");
  }

  for (const item of news.items.slice(0, 10)) {
    const parts = [
      `- ${item.title || "(untitled)"}`,
      item.source ? `source=${item.source}` : "",
      item.publishedAt ? `published=${item.publishedAt}` : "",
      item.link ? `link=${item.link}` : ""
    ].filter(Boolean);

    lines.push(parts.join(" | "));
    if (item.summary) {
      lines.push(`  summary=${item.summary}`);
    }
  }

  return lines.join("\n");
}

function formatPortfolioSection(portfolio, portfolioNews) {
  const lines = [
    `Portfolio tickers file: ${portfolio.filePath}`,
    `Configured tickers: ${portfolio.tickers.length ? portfolio.tickers.join(", ") : "(none)"}`
  ];

  for (const bucket of portfolioNews.perTicker || []) {
    lines.push(`Ticker ${bucket.ticker}:`);

    if (bucket.errors?.length) {
      lines.push(`- errors=${bucket.errors.join(" | ")}`);
    }

    if (!bucket.items?.length) {
      lines.push("- No items found.");
      continue;
    }

    for (const item of bucket.items.slice(0, 5)) {
      const parts = [
        `- ${item.title || "(untitled)"}`,
        item.source ? `source=${item.source}` : "",
        item.publishedAt ? `published=${item.publishedAt}` : "",
        item.link ? `link=${item.link}` : ""
      ].filter(Boolean);

      lines.push(parts.join(" | "));
      if (item.summary) {
        lines.push(`  summary=${item.summary}`);
      }
    }
  }

  return lines.join("\n");
}

function formatMorningRecapText(data) {
  return [
    `Morning recap context generatedAt=${data.generatedAt} timezone=${data.timezone}`,
    formatNewsSection("World headlines", data.world),
    formatNewsSection("Tech headlines", data.tech),
    formatNewsSection("Finance headlines", data.finance),
    formatNewsSection("NFL headlines", data.nfl),
    formatNewsSection("NBA headlines", data.nba),
    formatPortfolioSection(data.portfolio, data.portfolioNews)
  ].join("\n\n");
}

async function getMorningRecapContext() {
  const [world, tech, finance, nfl, nba, portfolioNews] = await Promise.all([
    fetchNewsByCategory("world", config.newsLookbackHours),
    fetchNewsByCategory("finance", config.newsLookbackHours),
    fetchNewsByCategory("tech", config.newsLookbackHours),
    fetchNewsByCategory("nfl", config.newsLookbackHours),
    fetchNewsByCategory("nba", config.newsLookbackHours),
    fetchPortfolioNews(config.portfolio.tickers, config.newsLookbackHours)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    timezone: config.timezone,
    world,
    portfolio: config.portfolio,
    finance,
    tech,
    nfl,
    nba,
    portfolioNews
  };
}

function toolResponse(text, structuredContent) {
  return {
    content: [{ type: "text", text }],
    structuredContent
  };
}

async function handleRequest(message) {
  if (message.method === "initialize") {
    writeMessage({
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "secretary-openclaw-agent",
          version: "0.1.0"
        }
      }
    });
    return;
  }

  if (message.method === "notifications/initialized") {
    return;
  }

  if (message.method === "tools/list") {
    writeMessage({
      jsonrpc: "2.0",
      id: message.id,
      result: {
        tools: [
          {
            name: "get_morning_recap_context",
            description: "Fetch world news, tech and AI drama news, finance news, NFL news, NBA news, and portfolio ticker news for the morning recap.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {}
            }
          }
        ]
      }
    });
    return;
  }

  if (message.method === "tools/call") {
    const toolName = message.params?.name;

    if (toolName === "get_morning_recap_context") {
      const data = await getMorningRecapContext();
      writeMessage({
        jsonrpc: "2.0",
        id: message.id,
        result: toolResponse(
          formatMorningRecapText(data),
          data
        )
      });
      return;
    }

    writeMessage({
      jsonrpc: "2.0",
      id: message.id,
      error: {
        code: -32601,
        message: `Unknown tool: ${toolName}`
      }
    });
    return;
  }

  if (typeof message.id !== "undefined") {
    writeMessage({
      jsonrpc: "2.0",
      id: message.id,
      error: {
        code: -32601,
        message: `Unsupported method: ${message.method}`
      }
    });
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", async (line) => {
  if (!line.trim()) {
    return;
  }

  try {
    const message = JSON.parse(line);
    await handleRequest(message);
  } catch (error) {
    writeMessage({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : "Unhandled server error"
      }
    });
  }
});
