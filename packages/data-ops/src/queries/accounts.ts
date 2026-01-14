import { getDb } from "@/db/database";
import { accounts, plaidItems } from "@/drizzle-out/finance-schema";
import { CreateAccount } from "@/zod/finance";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function createAccount(data: CreateAccount & { userId: string }) {
  const db = getDb();
  const accountId = nanoid(16);
  const now = Date.now().toString();

  await db.insert(accounts).values({
    accountId,
    userId: data.userId,
    plaidAccountId: data.plaidAccountId,
    plaidAccessToken: data.plaidAccessToken,
    plaidItemId: data.plaidItemId,
    institutionId: data.institutionId,
    institutionName: data.institutionName,
    accountName: data.accountName,
    accountType: data.accountType,
    accountSubtype: data.accountSubtype,
    mask: data.mask,
    currentBalance: data.currentBalance,
    availableBalance: data.availableBalance,
    isoCurrencyCode: data.isoCurrencyCode,
    isActive: 1,
    lastSynced: now,
    createdAt: now,
    updatedAt: now,
  });

  return accountId;
}

export async function getAccounts(userId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.isActive, 1)))
    .orderBy(desc(accounts.createdAt));

  return result;
}

export async function getAccountById(accountId: string, userId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.accountId, accountId), eq(accounts.userId, userId)))
    .limit(1);

  return result[0] || null;
}

export async function getAccountsByType(userId: string, accountType: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.accountType, accountType),
        eq(accounts.isActive, 1),
      ),
    )
    .orderBy(desc(accounts.currentBalance));

  return result;
}

export async function updateAccountBalance(
  accountId: string,
  currentBalance: number,
  availableBalance?: number,
) {
  const db = getDb();
  const now = Date.now().toString();

  await db
    .update(accounts)
    .set({
      currentBalance,
      availableBalance,
      lastSynced: now,
      updatedAt: now,
    })
    .where(eq(accounts.accountId, accountId));
}

export async function deactivateAccount(accountId: string) {
  const db = getDb();
  const now = Date.now().toString();

  await db
    .update(accounts)
    .set({
      isActive: 0,
      updatedAt: now,
    })
    .where(eq(accounts.accountId, accountId));
}

export async function getAccountsByPlaidItem(userId: string, plaidItemId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.plaidItemId, plaidItemId),
        eq(accounts.isActive, 1),
      ),
    );

  return result;
}

// Plaid Items
export async function createPlaidItem(data: {
  userId: string;
  plaidItemId: string;
  plaidAccessToken: string;
  institutionId?: string;
  institutionName?: string;
  availableProducts?: string[];
  billedProducts?: string[];
}) {
  const db = getDb();
  const itemId = nanoid(16);
  const now = Date.now().toString();

  await db.insert(plaidItems).values({
    itemId,
    userId: data.userId,
    plaidItemId: data.plaidItemId,
    plaidAccessToken: data.plaidAccessToken,
    institutionId: data.institutionId,
    institutionName: data.institutionName,
    availableProducts: data.availableProducts
      ? JSON.stringify(data.availableProducts)
      : undefined,
    billedProducts: data.billedProducts
      ? JSON.stringify(data.billedProducts)
      : undefined,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  return itemId;
}

export async function getPlaidItem(userId: string, plaidItemId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(plaidItems)
    .where(
      and(eq(plaidItems.userId, userId), eq(plaidItems.plaidItemId, plaidItemId)),
    )
    .limit(1);

  return result[0] || null;
}

export async function updatePlaidItemStatus(
  plaidItemId: string,
  status: "active" | "error" | "needs_update",
  error?: string,
) {
  const db = getDb();
  const now = Date.now().toString();

  await db
    .update(plaidItems)
    .set({
      status,
      error,
      updatedAt: now,
    })
    .where(eq(plaidItems.plaidItemId, plaidItemId));
}
