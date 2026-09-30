import "server-only";
import YahooFinance from "yahoo-finance2";

export type Quote = {
  ticker: string;
  name: string;
  price: number;
  previousClose: number | null;
  changePercent: number | null;
  currency: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { quote: Quote | null; fetchedAt: number };

const globalForQuotes = globalThis as unknown as {
  yahooFinance?: InstanceType<typeof YahooFinance>;
  quoteCache?: Map<string, CacheEntry>;
};

const yf = (globalForQuotes.yahooFinance ??= new YahooFinance({
  suppressNotices: ["yahooSurvey"],
}));
const cache = (globalForQuotes.quoteCache ??= new Map<string, CacheEntry>());

export function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

/**
 * Fetch quotes for the given tickers, batched into one Yahoo request and cached
 * for five minutes. Unknown tickers map to null; network failures fall back to
 * stale cache entries (or null) instead of throwing, so pages still render.
 */
export async function getQuotes(
  tickers: string[],
  { force = false }: { force?: boolean } = {},
): Promise<Map<string, Quote | null>> {
  const symbols = [...new Set(tickers.map(normalizeTicker))].filter(Boolean);
  const now = Date.now();
  const stale = symbols.filter((s) => {
    const hit = cache.get(s);
    return force || !hit || now - hit.fetchedAt > CACHE_TTL_MS;
  });

  if (stale.length > 0) {
    try {
      const results = await yf.quote(stale, { return: "array" });
      const found = new Map(results.map((q) => [q.symbol.toUpperCase(), q]));
      for (const symbol of stale) {
        const q = found.get(symbol);
        const price = q?.regularMarketPrice;
        const quote: Quote | null =
          q && typeof price === "number"
            ? {
                ticker: symbol,
                name: q.shortName ?? q.longName ?? symbol,
                price,
                previousClose: q.regularMarketPreviousClose ?? null,
                changePercent: q.regularMarketChangePercent ?? null,
                currency: q.currency ?? "USD",
              }
            : null;
        cache.set(symbol, { quote, fetchedAt: now });
      }
    } catch (error) {
      console.error("Failed to fetch quotes from Yahoo Finance:", error);
    }
  }

  return new Map(symbols.map((s) => [s, cache.get(s)?.quote ?? null]));
}

export async function getQuote(ticker: string) {
  const symbol = normalizeTicker(ticker);
  return (await getQuotes([symbol])).get(symbol) ?? null;
}
