import "server-only";
import { prisma } from "@/lib/db";
import { getQuotes, type Quote } from "@/lib/quotes";

export type Holding = {
  id: string;
  ticker: string;
  shares: number;
  quote: Quote | null;
  marketValue: number | null;
  dayChange: number | null;
  weight: number | null; // % of total portfolio value
};

export type PortfolioSummary = {
  holdings: Holding[];
  totalValue: number;
  dayChange: number;
  dayChangePercent: number | null;
  unpricedCount: number;
  asOf: Date;
};

export async function getPortfolio({ force = false } = {}): Promise<PortfolioSummary> {
  const items = await prisma.portfolioItem.findMany({ orderBy: { ticker: "asc" } });
  const quotes = await getQuotes(
    items.map((i) => i.ticker),
    { force },
  );

  const priced = items.map((item) => {
    const quote = quotes.get(item.ticker) ?? null;
    const marketValue = quote ? quote.price * item.shares : null;
    const dayChange =
      quote && quote.previousClose != null
        ? (quote.price - quote.previousClose) * item.shares
        : null;
    return { id: item.id, ticker: item.ticker, shares: item.shares, quote, marketValue, dayChange };
  });

  const totalValue = priced.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
  const dayChange = priced.reduce((sum, h) => sum + (h.dayChange ?? 0), 0);
  const previousValue = totalValue - dayChange;

  const holdings = priced
    .map((h) => ({
      ...h,
      weight: h.marketValue != null && totalValue > 0 ? (h.marketValue / totalValue) * 100 : null,
    }))
    .sort((a, b) => (b.marketValue ?? -1) - (a.marketValue ?? -1));

  return {
    holdings,
    totalValue,
    dayChange,
    dayChangePercent: previousValue > 0 ? (dayChange / previousValue) * 100 : null,
    unpricedCount: holdings.filter((h) => h.quote == null).length,
    asOf: new Date(),
  };
}
