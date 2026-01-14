import { getDb } from "@/db/database";
import {
  investmentHoldings,
  investmentTransactions,
  securities,
} from "@/drizzle-out/finance-schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Securities
export async function createSecurity(data: {
  plaidSecurityId: string;
  isin?: string;
  cusip?: string;
  sedol?: string;
  ticker?: string;
  name: string;
  type?: string;
  closePrice?: number;
  closePriceAsOf?: string;
  isoCurrencyCode?: string;
}) {
  const db = getDb();
  const securityId = nanoid(16);
  const now = Date.now().toString();

  await db.insert(securities).values({
    securityId,
    plaidSecurityId: data.plaidSecurityId,
    isin: data.isin,
    cusip: data.cusip,
    sedol: data.sedol,
    ticker: data.ticker,
    name: data.name,
    type: data.type,
    closePrice: data.closePrice,
    closePriceAsOf: data.closePriceAsOf,
    isoCurrencyCode: data.isoCurrencyCode || "USD",
    updatedAt: now,
  });

  return securityId;
}

export async function getSecurityByPlaidId(plaidSecurityId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(securities)
    .where(eq(securities.plaidSecurityId, plaidSecurityId))
    .limit(1);

  return result[0] || null;
}

export async function updateSecurity(
  securityId: string,
  data: {
    closePrice?: number;
    closePriceAsOf?: string;
    ticker?: string;
    name?: string;
  },
) {
  const db = getDb();
  const now = Date.now().toString();

  await db
    .update(securities)
    .set({
      ...data,
      updatedAt: now,
    })
    .where(eq(securities.securityId, securityId));
}

// Holdings
export async function createHolding(data: {
  userId: string;
  accountId: string;
  securityId: string;
  quantity: number;
  institutionPrice?: number;
  institutionPriceAsOf?: string;
  institutionValue?: number;
  costBasis?: number;
  isoCurrencyCode?: string;
}) {
  const db = getDb();
  const holdingId = nanoid(16);
  const now = Date.now().toString();

  await db.insert(investmentHoldings).values({
    holdingId,
    userId: data.userId,
    accountId: data.accountId,
    securityId: data.securityId,
    quantity: data.quantity,
    institutionPrice: data.institutionPrice,
    institutionPriceAsOf: data.institutionPriceAsOf,
    institutionValue: data.institutionValue,
    costBasis: data.costBasis,
    isoCurrencyCode: data.isoCurrencyCode || "USD",
    lastSynced: now,
    createdAt: now,
    updatedAt: now,
  });

  return holdingId;
}

export async function getHoldings(userId: string, accountId?: string) {
  const db = getDb();

  const conditions = [eq(investmentHoldings.userId, userId)];

  if (accountId) {
    conditions.push(eq(investmentHoldings.accountId, accountId));
  }

  const result = await db
    .select({
      holding: investmentHoldings,
      security: securities,
    })
    .from(investmentHoldings)
    .leftJoin(
      securities,
      eq(investmentHoldings.securityId, securities.securityId),
    )
    .where(and(...conditions))
    .orderBy(desc(investmentHoldings.institutionValue));

  return result;
}

export async function getHoldingByAccountAndSecurity(
  accountId: string,
  securityId: string,
) {
  const db = getDb();

  const result = await db
    .select()
    .from(investmentHoldings)
    .where(
      and(
        eq(investmentHoldings.accountId, accountId),
        eq(investmentHoldings.securityId, securityId),
      ),
    )
    .limit(1);

  return result[0] || null;
}

export async function updateHolding(
  holdingId: string,
  data: {
    quantity?: number;
    institutionPrice?: number;
    institutionPriceAsOf?: string;
    institutionValue?: number;
    costBasis?: number;
  },
) {
  const db = getDb();
  const now = Date.now().toString();

  await db
    .update(investmentHoldings)
    .set({
      ...data,
      lastSynced: now,
      updatedAt: now,
    })
    .where(eq(investmentHoldings.holdingId, holdingId));
}

export async function upsertHolding(data: {
  userId: string;
  accountId: string;
  securityId: string;
  quantity: number;
  institutionPrice?: number;
  institutionPriceAsOf?: string;
  institutionValue?: number;
  costBasis?: number;
  isoCurrencyCode?: string;
}) {
  const existing = await getHoldingByAccountAndSecurity(
    data.accountId,
    data.securityId,
  );

  if (existing) {
    await updateHolding(existing.holdingId, {
      quantity: data.quantity,
      institutionPrice: data.institutionPrice,
      institutionPriceAsOf: data.institutionPriceAsOf,
      institutionValue: data.institutionValue,
      costBasis: data.costBasis,
    });
    return existing.holdingId;
  } else {
    return await createHolding(data);
  }
}

export async function deleteHoldingsByAccount(accountId: string) {
  const db = getDb();

  await db
    .delete(investmentHoldings)
    .where(eq(investmentHoldings.accountId, accountId));
}

// Investment Transactions
export async function createInvestmentTransaction(data: {
  userId: string;
  accountId: string;
  plaidInvestmentTransactionId: string;
  securityId?: string;
  date: string;
  name: string;
  amount: number;
  quantity?: number;
  price?: number;
  fees?: number;
  type: string;
  subtype?: string;
  isoCurrencyCode?: string;
}) {
  const db = getDb();
  const transactionId = nanoid(16);
  const now = Date.now().toString();

  await db.insert(investmentTransactions).values({
    transactionId,
    userId: data.userId,
    accountId: data.accountId,
    plaidInvestmentTransactionId: data.plaidInvestmentTransactionId,
    securityId: data.securityId,
    date: data.date,
    name: data.name,
    amount: data.amount,
    quantity: data.quantity,
    price: data.price,
    fees: data.fees,
    type: data.type,
    subtype: data.subtype,
    isoCurrencyCode: data.isoCurrencyCode || "USD",
    createdAt: now,
    updatedAt: now,
  });

  return transactionId;
}

export async function getInvestmentTransactions(
  userId: string,
  accountId?: string,
  startDate?: string,
  endDate?: string,
) {
  const db = getDb();

  const conditions = [eq(investmentTransactions.userId, userId)];

  if (accountId) {
    conditions.push(eq(investmentTransactions.accountId, accountId));
  }

  if (startDate) {
    conditions.push(gte(investmentTransactions.date, startDate));
  }

  if (endDate) {
    conditions.push(lte(investmentTransactions.date, endDate));
  }

  const result = await db
    .select({
      transaction: investmentTransactions,
      security: securities,
    })
    .from(investmentTransactions)
    .leftJoin(
      securities,
      eq(investmentTransactions.securityId, securities.securityId),
    )
    .where(and(...conditions))
    .orderBy(desc(investmentTransactions.date))
    .limit(100);

  return result;
}

export async function getInvestmentTransactionByPlaidId(
  plaidInvestmentTransactionId: string,
  userId: string,
) {
  const db = getDb();

  const result = await db
    .select()
    .from(investmentTransactions)
    .where(
      and(
        eq(
          investmentTransactions.plaidInvestmentTransactionId,
          plaidInvestmentTransactionId,
        ),
        eq(investmentTransactions.userId, userId),
      ),
    )
    .limit(1);

  return result[0] || null;
}

export async function upsertInvestmentTransaction(data: {
  userId: string;
  accountId: string;
  plaidInvestmentTransactionId: string;
  securityId?: string;
  date: string;
  name: string;
  amount: number;
  quantity?: number;
  price?: number;
  fees?: number;
  type: string;
  subtype?: string;
  isoCurrencyCode?: string;
}) {
  const existing = await getInvestmentTransactionByPlaidId(
    data.plaidInvestmentTransactionId,
    data.userId,
  );

  if (existing) {
    return existing.transactionId;
  } else {
    return await createInvestmentTransaction(data);
  }
}

// Analytics
export async function getPortfolioValue(userId: string, accountId?: string) {
  const db = getDb();

  const conditions = [eq(investmentHoldings.userId, userId)];

  if (accountId) {
    conditions.push(eq(investmentHoldings.accountId, accountId));
  }

  const result = await db
    .select({
      totalValue: sql<number>`SUM(${investmentHoldings.institutionValue})`,
      totalCostBasis: sql<number>`SUM(${investmentHoldings.costBasis})`,
    })
    .from(investmentHoldings)
    .where(and(...conditions));

  return result[0] || { totalValue: 0, totalCostBasis: 0 };
}

export async function getAssetAllocation(userId: string) {
  const db = getDb();

  const result = await db
    .select({
      type: securities.type,
      totalValue: sql<number>`SUM(${investmentHoldings.institutionValue})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(investmentHoldings)
    .leftJoin(
      securities,
      eq(investmentHoldings.securityId, securities.securityId),
    )
    .where(eq(investmentHoldings.userId, userId))
    .groupBy(securities.type);

  return result;
}
