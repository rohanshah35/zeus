const DEFAULT_FEEDS = {
  world: [
    { name: "Reuters World", url: "https://feeds.reuters.com/Reuters/worldNews" },
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "Associated Press", url: "https://feeds.apnews.com/rss/apf-topnews" }
  ],
  finance: [
    { name: "Reuters Markets", url: "https://feeds.reuters.com/reuters/businessNews" },
    { name: "CNBC Finance", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html" },
    { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" }
  ],
  tech: [
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
    { name: "Techmeme", url: "https://www.techmeme.com/feed.xml" },
    {
      name: "Google News AI + X",
      url: buildGoogleNewsRssUrl('(AI OR OpenAI OR Anthropic OR xAI OR "Elon Musk" OR Twitter OR X) when:1d')
    }
  ],
  nfl: [
    { name: "ESPN NFL", url: "https://www.espn.com/espn/rss/nfl/news" },
    { name: "Yahoo Sports NFL", url: "https://sports.yahoo.com/nfl/rss.xml" },
    { name: "Google News NFL", url: buildGoogleNewsRssUrl('(NFL OR football) when:1d') }
  ],
  nba: [
    { name: "ESPN NBA", url: "https://www.espn.com/espn/rss/nba/news" },
    { name: "Yahoo Sports NBA", url: "https://sports.yahoo.com/nba/rss.xml" },
    { name: "Google News NBA", url: buildGoogleNewsRssUrl('(NBA OR basketball) when:1d') }
  ]
};

function buildGoogleNewsRssUrl(query) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en"
  });

  return `https://news.google.com/rss/search?${params.toString()}`;
}

function decodeXml(text) {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(text) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? stripHtml(decodeXml(match[1])) : "";
}

function parseItems(xml) {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return itemMatches.map((block) => ({
    title: extractTag(block, "title"),
    link: extractTag(block, "link"),
    publishedAt: extractTag(block, "pubDate") || extractTag(block, "published") || extractTag(block, "updated"),
    summary: extractTag(block, "description")
  }));
}

function withinLookback(publishedAt, lookbackHours) {
  if (!publishedAt) {
    return true;
  }

  const timestamp = Date.parse(publishedAt);
  if (Number.isNaN(timestamp)) {
    return true;
  }

  const ageMs = Date.now() - timestamp;
  return ageMs <= lookbackHours * 60 * 60 * 1000;
}

async function fetchFeed(feed, lookbackHours) {
  const response = await fetch(feed.url, {
    headers: {
      "user-agent": "secretary-openclaw-agent/0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${feed.name}: ${response.status}`);
  }

  const xml = await response.text();
  return parseItems(xml)
    .filter((item) => item.title && withinLookback(item.publishedAt, lookbackHours))
    .slice(0, 8)
    .map((item) => ({
      ...item,
      source: feed.name
    }));
}

export async function fetchNewsByCategory(category, lookbackHours) {
  const feeds = DEFAULT_FEEDS[category] || [];
  const settled = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed, lookbackHours)));

  const items = [];
  const errors = [];

  for (const result of settled) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      errors.push(result.reason.message);
    }
  }

  const deduped = Array.from(
    new Map(items.map((item) => [`${item.title}|${item.link}`, item])).values()
  ).slice(0, 12);

  return {
    category,
    items: deduped,
    errors
  };
}

export async function fetchPortfolioNews(tickers, lookbackHours) {
  const perTicker = await Promise.all(
    tickers.map(async (ticker) => {
      const feed = {
        name: `${ticker} News`,
        url: buildGoogleNewsRssUrl(`(${ticker} OR ${ticker} stock OR ${ticker} earnings) when:1d`)
      };

      try {
        const items = await fetchFeed(feed, lookbackHours);
        return {
          ticker,
          items: items.slice(0, 6),
          errors: []
        };
      } catch (error) {
        return {
          ticker,
          items: [],
          errors: [error instanceof Error ? error.message : String(error)]
        };
      }
    })
  );

  return {
    tickers,
    perTicker
  };
}
