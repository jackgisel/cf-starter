import { getDb } from "@/db/database";
import { transactions } from "@/drizzle-out/finance-schema";
import { TransactionListQuery } from "@/zod/finance";
import { eq, and, desc, gte, lte, sql, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function createTransaction(data: {
  userId: string;
  accountId: string;
  plaidTransactionId: string;
  amount: number;
  date: string;
  authorizedDate?: string;
  name: string;
  merchantName?: string;
  paymentChannel?: string;
  category?: string[];
  categoryId?: string;
  pending?: boolean;
  transactionType?: string;
  personalFinanceCategory?: any;
  logoUrl?: string;
  website?: string;
  isoCurrencyCode?: string;
}) {
  const db = getDb();
  const transactionId = nanoid(16);
  const now = Date.now().toString();

  await db.insert(transactions).values({
    transactionId,
    userId: data.userId,
    accountId: data.accountId,
    plaidTransactionId: data.plaidTransactionId,
    amount: data.amount,
    date: data.date,
    authorizedDate: data.authorizedDate,
    name: data.name,
    merchantName: data.merchantName,
    paymentChannel: data.paymentChannel,
    category: data.category ? JSON.stringify(data.category) : undefined,
    categoryId: data.categoryId,
    pending: data.pending ? 1 : 0,
    transactionType: data.transactionType,
    personalFinanceCategory: data.personalFinanceCategory
      ? JSON.stringify(data.personalFinanceCategory)
      : undefined,
    logoUrl: data.logoUrl,
    website: data.website,
    isoCurrencyCode: data.isoCurrencyCode || "USD",
    createdAt: now,
    updatedAt: now,
  });

  return transactionId;
}

export async function getTransactions(userId: string, query: TransactionListQuery) {
  const db = getDb();

  const conditions = [eq(transactions.userId, userId)];

  if (query.accountId) {
    conditions.push(eq(transactions.accountId, query.accountId));
  }

  if (query.startDate) {
    conditions.push(gte(transactions.date, query.startDate));
  }

  if (query.endDate) {
    conditions.push(lte(transactions.date, query.endDate));
  }

  if (query.minAmount !== undefined) {
    conditions.push(gte(transactions.amount, query.minAmount));
  }

  if (query.maxAmount !== undefined) {
    conditions.push(lte(transactions.amount, query.maxAmount));
  }

  if (query.categoryId) {
    conditions.push(eq(transactions.categoryId, query.categoryId));
  }

  if (query.searchTerm) {
    conditions.push(
      or(
        like(transactions.name, `%${query.searchTerm}%`),
        like(transactions.merchantName, `%${query.searchTerm}%`),
      )!,
    );
  }

  const result = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date))
    .limit(query.limit || 50)
    .offset(query.offset || 0);

  return result;
}

export async function getTransactionById(transactionId: string, userId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.transactionId, transactionId), eq(transactions.userId, userId)),
    )
    .limit(1);

  return result[0] || null;
}

export async function getTransactionByPlaidId(
  plaidTransactionId: string,
  userId: string,
) {
  const db = getDb();

  const result = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.plaidTransactionId, plaidTransactionId),
        eq(transactions.userId, userId),
      ),
    )
    .limit(1);

  return result[0] || null;
}

export async function updateTransaction(
  transactionId: string,
  data: {
    amount?: number;
    date?: string;
    name?: string;
    pending?: boolean;
  },
) {
  const db = getDb();
  const now = Date.now().toString();

  await db
    .update(transactions)
    .set({
      ...data,
      pending: data.pending !== undefined ? (data.pending ? 1 : 0) : undefined,
      updatedAt: now,
    })
    .where(eq(transactions.transactionId, transactionId));
}

export async function upsertTransaction(data: {
  userId: string;
  accountId: string;
  plaidTransactionId: string;
  amount: number;
  date: string;
  authorizedDate?: string;
  name: string;
  merchantName?: string;
  paymentChannel?: string;
  category?: string[];
  categoryId?: string;
  pending?: boolean;
  transactionType?: string;
  personalFinanceCategory?: any;
  logoUrl?: string;
  website?: string;
  isoCurrencyCode?: string;
}) {
  // Check if transaction exists
  const existing = await getTransactionByPlaidId(data.plaidTransactionId, data.userId);

  if (existing) {
    // Update existing transaction
    await updateTransaction(existing.transactionId, {
      amount: data.amount,
      date: data.date,
      name: data.name,
      pending: data.pending,
    });
    return existing.transactionId;
  } else {
    // Create new transaction
    return await createTransaction(data);
  }
}

// Analytics queries
export async function getSpendingByMerchant(
  userId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 10,
) {
  const db = getDb();

  const conditions = [
    eq(transactions.userId, userId),
    sql`${transactions.amount} > 0`, // Positive amounts are expenses
  ];

  if (startDate) {
    conditions.push(gte(transactions.date, startDate));
  }

  if (endDate) {
    conditions.push(lte(transactions.date, endDate));
  }

  const result = await db
    .select({
      merchantName: transactions.merchantName,
      totalAmount: sql<number>`SUM(${transactions.amount})`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.merchantName)
    .orderBy(desc(sql`SUM(${transactions.amount})`))
    .limit(limit);

  return result;
}

export async function getSpendingByCategory(
  userId: string,
  startDate?: string,
  endDate?: string,
) {
  const db = getDb();

  const conditions = [
    eq(transactions.userId, userId),
    sql`${transactions.amount} > 0`, // Positive amounts are expenses
  ];

  if (startDate) {
    conditions.push(gte(transactions.date, startDate));
  }

  if (endDate) {
    conditions.push(lte(transactions.date, endDate));
  }

  const result = await db
    .select({
      categoryId: transactions.categoryId,
      totalAmount: sql<number>`SUM(${transactions.amount})`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.categoryId)
    .orderBy(desc(sql`SUM(${transactions.amount})`));

  return result;
}

export async function getMonthlySpending(userId: string, months: number = 12) {
  const db = getDb();

  // Get spending by month for the last N months
  const result = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
      totalSpending: sql<number>`SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END)`,
      totalIncome: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .groupBy(sql`strftime('%Y-%m', ${transactions.date})`)
    .orderBy(desc(sql`strftime('%Y-%m', ${transactions.date})`))
    .limit(months);

  return result;
}
