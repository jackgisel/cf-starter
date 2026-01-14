import { z } from "zod";

// Account schemas
export const accountSchema = z.object({
  accountId: z.string(),
  userId: z.string(),
  plaidAccountId: z.string(),
  plaidAccessToken: z.string(),
  plaidItemId: z.string(),
  institutionId: z.string().optional(),
  institutionName: z.string().optional(),
  accountName: z.string(),
  accountType: z.enum(["depository", "investment", "credit", "loan", "other"]),
  accountSubtype: z.string().optional(),
  mask: z.string().optional(),
  currentBalance: z.number().optional(),
  availableBalance: z.number().optional(),
  isoCurrencyCode: z.string().default("USD"),
  unofficialCurrencyCode: z.string().optional(),
  lastSynced: z.number().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createAccountSchema = z.object({
  plaidAccountId: z.string(),
  plaidAccessToken: z.string(),
  plaidItemId: z.string(),
  institutionId: z.string().optional(),
  institutionName: z.string().optional(),
  accountName: z.string().min(1),
  accountType: z.enum(["depository", "investment", "credit", "loan", "other"]),
  accountSubtype: z.string().optional(),
  mask: z.string().optional(),
  currentBalance: z.number().optional(),
  availableBalance: z.number().optional(),
  isoCurrencyCode: z.string().default("USD"),
});

// Transaction schemas
export const transactionSchema = z.object({
  transactionId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  plaidTransactionId: z.string(),
  amount: z.number(),
  isoCurrencyCode: z.string().default("USD"),
  unofficialCurrencyCode: z.string().optional(),
  date: z.string(),
  authorizedDate: z.string().optional(),
  name: z.string(),
  merchantName: z.string().optional(),
  paymentChannel: z.string().optional(),
  category: z.string().optional(), // JSON stringified array
  categoryId: z.string().optional(),
  pending: z.boolean().default(false),
  transactionType: z.string().optional(),
  personalFinanceCategory: z.string().optional(), // JSON stringified object
  logoUrl: z.string().optional(),
  website: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const transactionListQuerySchema = z.object({
  accountId: z.string().optional(),
  startDate: z.string().optional(), // YYYY-MM-DD
  endDate: z.string().optional(), // YYYY-MM-DD
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  searchTerm: z.string().optional(),
  categoryId: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

// Security schemas
export const securitySchema = z.object({
  securityId: z.string(),
  plaidSecurityId: z.string(),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  sedol: z.string().optional(),
  ticker: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  closePrice: z.number().optional(),
  closePriceAsOf: z.string().optional(),
  isoCurrencyCode: z.string().default("USD"),
  unofficialCurrencyCode: z.string().optional(),
  proxySecurityId: z.string().optional(),
  updatedAt: z.number(),
});

// Investment holding schemas
export const investmentHoldingSchema = z.object({
  holdingId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  securityId: z.string(),
  quantity: z.number(),
  institutionPrice: z.number().optional(),
  institutionPriceAsOf: z.string().optional(),
  institutionValue: z.number().optional(),
  costBasis: z.number().optional(),
  isoCurrencyCode: z.string().default("USD"),
  unofficialCurrencyCode: z.string().optional(),
  lastSynced: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Investment transaction schemas
export const investmentTransactionSchema = z.object({
  transactionId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  plaidInvestmentTransactionId: z.string(),
  securityId: z.string().optional(),
  date: z.string(),
  name: z.string(),
  amount: z.number(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  fees: z.number().optional(),
  type: z.string(),
  subtype: z.string().optional(),
  isoCurrencyCode: z.string().default("USD"),
  unofficialCurrencyCode: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Goal schemas
export const goalSchema = z.object({
  goalId: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  goalType: z.enum(["savings", "net_worth", "portfolio", "debt_payoff"]),
  targetAmount: z.number().positive(),
  currentAmount: z.number().default(0),
  targetDate: z.string().optional(), // YYYY-MM-DD
  linkedAccountIds: z.string().optional(), // JSON stringified array
  isCompleted: z.boolean().default(false),
  completedAt: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  goalType: z.enum(["savings", "net_worth", "portfolio", "debt_payoff"]),
  targetAmount: z.number().positive(),
  targetDate: z.string().optional(),
  linkedAccountIds: z.array(z.string()).optional(),
});

export const updateGoalSchema = z.object({
  goalId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive().optional(),
  targetDate: z.string().optional(),
  linkedAccountIds: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
});

// Goal progress schemas
export const goalProgressSchema = z.object({
  progressId: z.string(),
  goalId: z.string(),
  userId: z.string(),
  amount: z.number(),
  date: z.string(),
  createdAt: z.number(),
});

// Plaid item schemas
export const plaidItemSchema = z.object({
  itemId: z.string(),
  userId: z.string(),
  plaidItemId: z.string(),
  plaidAccessToken: z.string(),
  institutionId: z.string().optional(),
  institutionName: z.string().optional(),
  status: z.enum(["active", "error", "needs_update"]).default("active"),
  error: z.string().optional(),
  availableProducts: z.string().optional(),
  billedProducts: z.string().optional(),
  consentExpirationTime: z.string().optional(),
  webhookUrl: z.string().optional(),
  lastWebhook: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Plaid API schemas
export const createLinkTokenSchema = z.object({
  userId: z.string(),
  products: z.array(z.enum(["auth", "transactions", "investments", "liabilities", "identity"])),
});

export const exchangePublicTokenSchema = z.object({
  publicToken: z.string(),
  userId: z.string(),
});

export const syncAccountSchema = z.object({
  accountId: z.string(),
});

// Analytics schemas
export const dateRangeSchema = z.object({
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(), // YYYY-MM-DD
});

export const spendingByMerchantSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().default(10),
});

export const netWorthQuerySchema = z.object({
  period: z.enum(["7d", "30d", "90d", "1y", "all"]).default("30d"),
});

// Queue message schemas
export const syncTransactionsMessageSchema = z.object({
  type: z.literal("SYNC_TRANSACTIONS"),
  data: z.object({
    accountId: z.string(),
    userId: z.string(),
    plaidItemId: z.string(),
    plaidAccessToken: z.string(),
  }),
});

export const syncInvestmentsMessageSchema = z.object({
  type: z.literal("SYNC_INVESTMENTS"),
  data: z.object({
    accountId: z.string(),
    userId: z.string(),
    plaidItemId: z.string(),
    plaidAccessToken: z.string(),
  }),
});

export const queueMessageSchema = z.discriminatedUnion("type", [
  syncTransactionsMessageSchema,
  syncInvestmentsMessageSchema,
]);

// Type exports
export type Account = z.infer<typeof accountSchema>;
export type CreateAccount = z.infer<typeof createAccountSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;
export type Security = z.infer<typeof securitySchema>;
export type InvestmentHolding = z.infer<typeof investmentHoldingSchema>;
export type InvestmentTransaction = z.infer<typeof investmentTransactionSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type CreateGoal = z.infer<typeof createGoalSchema>;
export type UpdateGoal = z.infer<typeof updateGoalSchema>;
export type GoalProgress = z.infer<typeof goalProgressSchema>;
export type PlaidItem = z.infer<typeof plaidItemSchema>;
export type CreateLinkToken = z.infer<typeof createLinkTokenSchema>;
export type ExchangePublicToken = z.infer<typeof exchangePublicTokenSchema>;
export type QueueMessage = z.infer<typeof queueMessageSchema>;
