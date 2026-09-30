import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Noon UTC on the given day, matching how the app stores transaction dates. */
function day(monthsAgo: number, dayOfMonth: number) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth, 12));
  return d > now ? new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12)) : d;
}

function jitter(base: number, spread: number) {
  return Math.round((base + (Math.random() - 0.5) * spread) * 100) / 100;
}

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.portfolioItem.deleteMany();

  const transactions = [];
  for (let m = 5; m >= 0; m--) {
    transactions.push(
      { type: "INCOME", category: "Salary", amount: 5200, description: "Monthly salary", date: day(m, 1) },
      { type: "EXPENSE", category: "Rent", amount: 1650, description: "Apartment rent", date: day(m, 2) },
      { type: "EXPENSE", category: "Subscriptions", amount: 15.49, description: "Netflix", date: day(m, 5) },
      { type: "EXPENSE", category: "Subscriptions", amount: 11.99, description: "Spotify", date: day(m, 8) },
      { type: "EXPENSE", category: "Utilities", amount: jitter(140, 40), description: "Electricity & internet", date: day(m, 10) },
      { type: "EXPENSE", category: "Food", amount: jitter(420, 120), description: "Groceries", date: day(m, 12) },
      { type: "EXPENSE", category: "Food", amount: jitter(160, 80), description: "Restaurants", date: day(m, 19) },
      { type: "EXPENSE", category: "Transport", amount: jitter(95, 40), description: "Transit & fuel", date: day(m, 15) },
      { type: "EXPENSE", category: "Entertainment", amount: jitter(80, 60), description: null, date: day(m, 22) },
    );
    if (m % 2 === 0) {
      transactions.push({ type: "INCOME", category: "Freelance", amount: jitter(900, 400), description: "Side project", date: day(m, 18) });
    }
    if (m % 3 === 1) {
      transactions.push({ type: "EXPENSE", category: "Health", amount: jitter(120, 60), description: "Pharmacy", date: day(m, 24) });
    }
  }

  await prisma.transaction.createMany({ data: transactions });
  await prisma.portfolioItem.createMany({
    data: [
      { ticker: "AAPL", shares: 12 },
      { ticker: "MSFT", shares: 6.5 },
      { ticker: "VOO", shares: 10.25 },
      { ticker: "NVDA", shares: 8 },
    ],
  });

  console.log(`Seeded ${transactions.length} transactions and 4 holdings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
