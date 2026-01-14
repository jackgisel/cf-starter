import {
  CountryCode,
  Products,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
} from "plaid";
import { getPlaidClient } from "./client";
import {
  createAccount,
  createPlaidItem,
  getAccountsByPlaidItem,
  updateAccountBalance,
} from "@/queries/accounts";
import { upsertTransaction } from "@/queries/transactions";
import {
  createSecurity,
  getSecurityByPlaidId,
  upsertHolding,
  upsertInvestmentTransaction,
  deleteHoldingsByAccount,
} from "@/queries/investments";

export interface PlaidEnv {
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENV?: string;
  PLAID_WEBHOOK_URL?: string;
}

/**
 * Create a Link token for Plaid Link initialization
 */
export async function createLinkToken(
  userId: string,
  products: Products[],
  env: PlaidEnv,
) {
  const client = getPlaidClient(env);

  const request: LinkTokenCreateRequest = {
    user: {
      client_user_id: userId,
    },
    client_name: "Personal Finance App",
    products: products,
    country_codes: [CountryCode.Us],
    language: "en",
    webhook: env.PLAID_WEBHOOK_URL,
  };

  const response = await client.linkTokenCreate(request);
  return response.data;
}

/**
 * Exchange public token for access token
 */
export async function exchangePublicToken(
  publicToken: string,
  userId: string,
  env: PlaidEnv,
) {
  const client = getPlaidClient(env);

  const request: ItemPublicTokenExchangeRequest = {
    public_token: publicToken,
  };

  const response = await client.itemPublicTokenExchange(request);
  const accessToken = response.data.access_token;
  const itemId = response.data.item_id;

  // Get item details
  const itemResponse = await client.itemGet({ access_token: accessToken });
  const item = itemResponse.data.item;

  // Get institution info
  let institutionName: string | undefined;
  if (item.institution_id) {
    try {
      const instResponse = await client.institutionsGetById({
        institution_id: item.institution_id,
        country_codes: [CountryCode.Us],
      });
      institutionName = instResponse.data.institution.name;
    } catch (error) {
      console.error("Error fetching institution:", error);
    }
  }

  // Store Plaid item
  await createPlaidItem({
    userId,
    plaidItemId: itemId,
    plaidAccessToken: accessToken,
    institutionId: item.institution_id || undefined,
    institutionName,
    availableProducts: item.available_products,
    billedProducts: item.billed_products,
  });

  // Get and store accounts
  const accountsResponse = await client.accountsGet({ access_token: accessToken });
  const accounts = accountsResponse.data.accounts;

  const accountIds: string[] = [];

  for (const account of accounts) {
    const accountId = await createAccount({
      userId,
      plaidAccountId: account.account_id,
      plaidAccessToken: accessToken,
      plaidItemId: itemId,
      institutionId: item.institution_id || undefined,
      institutionName,
      accountName: account.name,
      accountType: account.type as any,
      accountSubtype: account.subtype || undefined,
      mask: account.mask || undefined,
      currentBalance: account.balances.current || undefined,
      availableBalance: account.balances.available || undefined,
      isoCurrencyCode: account.balances.iso_currency_code || "USD",
    });

    accountIds.push(accountId);
  }

  return {
    accessToken,
    itemId,
    accounts: accountIds,
  };
}

/**
 * Sync transactions for an account
 */
export async function syncTransactions(
  userId: string,
  accessToken: string,
  accountId: string,
  plaidAccountId: string,
  env: PlaidEnv,
  cursor?: string,
) {
  const client = getPlaidClient(env);

  let hasMore = true;
  let nextCursor = cursor;
  const allTransactions: any[] = [];

  while (hasMore) {
    const request: any = {
      access_token: accessToken,
    };

    if (nextCursor) {
      request.cursor = nextCursor;
    }

    const response = await client.transactionsSync(request);
    const { added, modified, removed, next_cursor, has_more } = response.data;

    // Add new transactions
    for (const transaction of added) {
      if (transaction.account_id === plaidAccountId) {
        await upsertTransaction({
          userId,
          accountId,
          plaidTransactionId: transaction.transaction_id,
          amount: transaction.amount,
          date: transaction.date,
          authorizedDate: transaction.authorized_date || undefined,
          name: transaction.name,
          merchantName: transaction.merchant_name || undefined,
          paymentChannel: transaction.payment_channel || undefined,
          category: transaction.category || undefined,
          categoryId: transaction.category_id || undefined,
          pending: transaction.pending,
          transactionType: transaction.transaction_type || undefined,
          personalFinanceCategory: transaction.personal_finance_category || undefined,
          logoUrl: transaction.logo_url || undefined,
          website: transaction.website || undefined,
          isoCurrencyCode: transaction.iso_currency_code || "USD",
        });
        allTransactions.push(transaction);
      }
    }

    // Update modified transactions
    for (const transaction of modified) {
      if (transaction.account_id === plaidAccountId) {
        await upsertTransaction({
          userId,
          accountId,
          plaidTransactionId: transaction.transaction_id,
          amount: transaction.amount,
          date: transaction.date,
          authorizedDate: transaction.authorized_date || undefined,
          name: transaction.name,
          merchantName: transaction.merchant_name || undefined,
          paymentChannel: transaction.payment_channel || undefined,
          category: transaction.category || undefined,
          categoryId: transaction.category_id || undefined,
          pending: transaction.pending,
          transactionType: transaction.transaction_type || undefined,
          personalFinanceCategory: transaction.personal_finance_category || undefined,
          logoUrl: transaction.logo_url || undefined,
          website: transaction.website || undefined,
          isoCurrencyCode: transaction.iso_currency_code || "USD",
        });
      }
    }

    // TODO: Handle removed transactions if needed

    nextCursor = next_cursor;
    hasMore = has_more;
  }

  return {
    transactionCount: allTransactions.length,
    cursor: nextCursor,
  };
}

/**
 * Sync investment holdings and transactions
 */
export async function syncInvestments(
  userId: string,
  accessToken: string,
  accountId: string,
  plaidAccountId: string,
  env: PlaidEnv,
) {
  const client = getPlaidClient(env);

  // Get holdings
  const holdingsResponse = await client.investmentsHoldingsGet({
    access_token: accessToken,
  });

  const { holdings, securities: securitiesData } = holdingsResponse.data;

  // First, process all securities
  const securityMap = new Map<string, string>(); // plaidSecurityId -> securityId

  for (const security of securitiesData) {
    // Check if security exists
    let existingSecurity = await getSecurityByPlaidId(security.security_id);

    if (!existingSecurity) {
      const securityId = await createSecurity({
        plaidSecurityId: security.security_id,
        isin: security.isin || undefined,
        cusip: security.cusip || undefined,
        sedol: security.sedol || undefined,
        ticker: security.ticker_symbol || undefined,
        name: security.name || "Unknown Security",
        type: security.type || undefined,
        closePrice: security.close_price || undefined,
        closePriceAsOf: security.close_price_as_of || undefined,
        isoCurrencyCode: security.iso_currency_code || "USD",
      });
      securityMap.set(security.security_id, securityId);
    } else {
      securityMap.set(security.security_id, existingSecurity.securityId);
    }
  }

  // Clear existing holdings for this account
  await deleteHoldingsByAccount(accountId);

  // Add current holdings
  for (const holding of holdings) {
    if (holding.account_id === plaidAccountId) {
      const securityId = securityMap.get(holding.security_id);
      if (securityId) {
        await upsertHolding({
          userId,
          accountId,
          securityId,
          quantity: holding.quantity,
          institutionPrice: holding.institution_price || undefined,
          institutionPriceAsOf: holding.institution_price_as_of || undefined,
          institutionValue: holding.institution_value || undefined,
          costBasis: holding.cost_basis || undefined,
          isoCurrencyCode: holding.iso_currency_code || "USD",
        });
      }
    }
  }

  // Get investment transactions
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2); // Last 2 years
  const endDate = new Date();

  const transactionsResponse = await client.investmentsTransactionsGet({
    access_token: accessToken,
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
  });

  const { investment_transactions } = transactionsResponse.data;

  for (const transaction of investment_transactions) {
    if (transaction.account_id === plaidAccountId) {
      const securityId = transaction.security_id
        ? securityMap.get(transaction.security_id)
        : undefined;

      await upsertInvestmentTransaction({
        userId,
        accountId,
        plaidInvestmentTransactionId: transaction.investment_transaction_id,
        securityId,
        date: transaction.date,
        name: transaction.name,
        amount: transaction.amount,
        quantity: transaction.quantity || undefined,
        price: transaction.price || undefined,
        fees: transaction.fees || undefined,
        type: transaction.type,
        subtype: transaction.subtype || undefined,
        isoCurrencyCode: transaction.iso_currency_code || "USD",
      });
    }
  }

  return {
    holdingsCount: holdings.filter((h) => h.account_id === plaidAccountId).length,
    transactionsCount: investment_transactions.filter(
      (t) => t.account_id === plaidAccountId,
    ).length,
  };
}

/**
 * Sync account balances
 */
export async function syncAccountBalances(
  userId: string,
  plaidItemId: string,
  accessToken: string,
  env: PlaidEnv,
) {
  const client = getPlaidClient(env);

  const response = await client.accountsBalanceGet({ access_token: accessToken });
  const accounts = response.data.accounts;

  // Get our stored accounts for this item
  const storedAccounts = await getAccountsByPlaidItem(userId, plaidItemId);

  for (const account of accounts) {
    const storedAccount = storedAccounts.find(
      (a) => a.plaidAccountId === account.account_id,
    );

    if (storedAccount) {
      await updateAccountBalance(
        storedAccount.accountId,
        account.balances.current || 0,
        account.balances.available || undefined,
      );
    }
  }

  return { accountsUpdated: storedAccounts.length };
}
