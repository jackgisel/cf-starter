import { syncTransactions } from '@repo/data-ops/plaid/service';
import { SyncTransactionsMessageType } from '@repo/data-ops/zod-schema/queue';

export async function handleSyncTransactions(
  env: Env,
  event: SyncTransactionsMessageType,
) {
  const { accountId, userId, plaidAccountId, plaidAccessToken, cursor } = event.data;

  try {
    const result = await syncTransactions(
      userId,
      plaidAccessToken,
      accountId,
      plaidAccountId,
      {
        PLAID_CLIENT_ID: env.PLAID_CLIENT_ID,
        PLAID_SECRET: env.PLAID_SECRET,
        PLAID_ENV: env.PLAID_ENV,
      },
      cursor,
    );

    console.log(`Synced ${result.transactionCount} transactions for account ${accountId}`);

    // If there are more transactions, queue another sync with the new cursor
    if (result.cursor) {
      // TODO: Queue another sync message with the new cursor
      // This allows pagination through large transaction sets
    }

    return result;
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw error;
  }
}
