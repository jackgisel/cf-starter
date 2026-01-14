import {
  sqliteTable,
  index,
  text,
  numeric,
  real,
  integer,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Plaid linked accounts (banking and investment)
export const accounts = sqliteTable(
  "accounts",
  {
    accountId: text("account_id").primaryKey(),
    userId: text("user_id").notNull(),
    plaidAccountId: text("plaid_account_id").notNull(),
    plaidAccessToken: text("plaid_access_token").notNull(),
    plaidItemId: text("plaid_item_id").notNull(),
    institutionId: text("institution_id"),
    institutionName: text("institution_name"),
    accountName: text("account_name").notNull(),
    accountType: text("account_type").notNull(), // depository, investment, credit, loan
    accountSubtype: text("account_subtype"), // checking, savings, 401k, brokerage, etc
    mask: text(), // last 4 digits
    currentBalance: real("current_balance"),
    availableBalance: real("available_balance"),
    isoCurrencyCode: text("iso_currency_code").default("USD"),
    unofficialCurrencyCode: text("unofficial_currency_code"),
    lastSynced: numeric("last_synced"),
    isActive: integer("is_active").default(1).notNull(), // 1 or 0
    createdAt: numeric("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_accounts_user_id").on(table.userId),
    index("idx_accounts_plaid_item_id").on(table.plaidItemId),
    index("idx_accounts_account_type").on(table.accountType),
  ],
);

// Financial transactions from Plaid
export const transactions = sqliteTable(
  "transactions",
  {
    transactionId: text("transaction_id").primaryKey(),
    userId: text("user_id").notNull(),
    accountId: text("account_id").notNull(),
    plaidTransactionId: text("plaid_transaction_id").notNull(),
    amount: real().notNull(), // Positive = money out, Negative = money in (Plaid convention)
    isoCurrencyCode: text("iso_currency_code").default("USD"),
    unofficialCurrencyCode: text("unofficial_currency_code"),
    date: text().notNull(), // YYYY-MM-DD
    authorizedDate: text("authorized_date"), // YYYY-MM-DD
    name: text().notNull(), // Merchant/description
    merchantName: text("merchant_name"),
    paymentChannel: text("payment_channel"), // online, in store, other
    category: text(), // JSON array from Plaid
    categoryId: text("category_id"),
    pending: integer().default(0).notNull(), // 1 or 0
    transactionType: text("transaction_type"), // place, digital, special, unresolved
    personalFinanceCategory: text("personal_finance_category"), // JSON object
    logoUrl: text("logo_url"),
    website: text(),
    createdAt: numeric("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_transactions_user_id").on(table.userId),
    index("idx_transactions_account_id").on(table.accountId),
    index("idx_transactions_date").on(table.date),
    index("idx_transactions_merchant_name").on(table.merchantName),
    index("idx_transactions_category_id").on(table.categoryId),
  ],
);

// Securities master data
export const securities = sqliteTable(
  "securities",
  {
    securityId: text("security_id").primaryKey(),
    plaidSecurityId: text("plaid_security_id").notNull(),
    isin: text(), // International Securities Identification Number
    cusip: text(), // Committee on Uniform Securities Identification Procedures
    sedol: text(), // Stock Exchange Daily Official List
    ticker: text(),
    name: text().notNull(),
    type: text(), // equity, derivative, etf, fixed income, mutual fund, etc
    closePrice: real("close_price"),
    closePriceAsOf: text("close_price_as_of"), // YYYY-MM-DD
    isoCurrencyCode: text("iso_currency_code").default("USD"),
    unofficialCurrencyCode: text("unofficial_currency_code"),
    proxySecurityId: text("proxy_security_id"), // If security is mapped to another
    updatedAt: numeric("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_securities_ticker").on(table.ticker),
    index("idx_securities_type").on(table.type),
  ],
);

// Investment holdings (current positions)
export const investmentHoldings = sqliteTable(
  "investment_holdings",
  {
    holdingId: text("holding_id").primaryKey(),
    userId: text("user_id").notNull(),
    accountId: text("account_id").notNull(),
    securityId: text("security_id").notNull(),
    quantity: real().notNull(),
    institutionPrice: real("institution_price"), // Price from institution
    institutionPriceAsOf: text("institution_price_as_of"), // YYYY-MM-DD
    institutionValue: real("institution_value"), // quantity * institution_price
    costBasis: real("cost_basis"), // Total cost basis
    isoCurrencyCode: text("iso_currency_code").default("USD"),
    unofficialCurrencyCode: text("unofficial_currency_code"),
    lastSynced: numeric("last_synced"),
    createdAt: numeric("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_holdings_user_id").on(table.userId),
    index("idx_holdings_account_id").on(table.accountId),
    index("idx_holdings_security_id").on(table.securityId),
  ],
);

// Investment transactions (trades, dividends, fees)
export const investmentTransactions = sqliteTable(
  "investment_transactions",
  {
    transactionId: text("transaction_id").primaryKey(),
    userId: text("user_id").notNull(),
    accountId: text("account_id").notNull(),
    plaidInvestmentTransactionId: text("plaid_investment_transaction_id").notNull(),
    securityId: text("security_id"),
    date: text().notNull(), // YYYY-MM-DD
    name: text().notNull(),
    amount: real().notNull(),
    quantity: real(),
    price: real(), // Price per share
    fees: real(),
    type: text().notNull(), // buy, sell, dividend, fee, transfer, etc
    subtype: text(), // Plaid's detailed subtype
    isoCurrencyCode: text("iso_currency_code").default("USD"),
    unofficialCurrencyCode: text("unofficial_currency_code"),
    createdAt: numeric("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_investment_transactions_user_id").on(table.userId),
    index("idx_investment_transactions_account_id").on(table.accountId),
    index("idx_investment_transactions_security_id").on(table.securityId),
    index("idx_investment_transactions_date").on(table.date),
    index("idx_investment_transactions_type").on(table.type),
  ],
);

// Financial goals
export const goals = sqliteTable(
  "goals",
  {
    goalId: text("goal_id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    description: text(),
    goalType: text("goal_type").notNull(), // savings, net_worth, portfolio, debt_payoff
    targetAmount: real("target_amount").notNull(),
    currentAmount: real("current_amount").default(0),
    targetDate: text("target_date"), // YYYY-MM-DD
    linkedAccountIds: text("linked_account_ids"), // JSON array of account IDs
    isCompleted: integer("is_completed").default(0).notNull(), // 1 or 0
    completedAt: numeric("completed_at"),
    createdAt: numeric("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_goals_user_id").on(table.userId),
    index("idx_goals_type").on(table.goalType),
    index("idx_goals_completed").on(table.isCompleted),
  ],
);

// Historical snapshots of goal progress
export const goalProgress = sqliteTable(
  "goal_progress",
  {
    progressId: text("progress_id").primaryKey(),
    goalId: text("goal_id").notNull(),
    userId: text("user_id").notNull(),
    amount: real().notNull(),
    date: text().notNull(), // YYYY-MM-DD
    createdAt: numeric("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_goal_progress_goal_id").on(table.goalId),
    index("idx_goal_progress_date").on(table.date),
  ],
);

// Plaid items (connection metadata)
export const plaidItems = sqliteTable(
  "plaid_items",
  {
    itemId: text("item_id").primaryKey(),
    userId: text("user_id").notNull(),
    plaidItemId: text("plaid_item_id").notNull(),
    plaidAccessToken: text("plaid_access_token").notNull(),
    institutionId: text("institution_id"),
    institutionName: text("institution_name"),
    status: text().default("active").notNull(), // active, error, needs_update
    error: text(), // JSON error object if any
    availableProducts: text("available_products"), // JSON array
    billedProducts: text("billed_products"), // JSON array
    consentExpirationTime: text("consent_expiration_time"),
    webhookUrl: text("webhook_url"),
    lastWebhook: numeric("last_webhook"),
    createdAt: numeric("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: numeric("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_plaid_items_user_id").on(table.userId),
    index("idx_plaid_items_plaid_item_id").on(table.plaidItemId),
    index("idx_plaid_items_status").on(table.status),
  ],
);
