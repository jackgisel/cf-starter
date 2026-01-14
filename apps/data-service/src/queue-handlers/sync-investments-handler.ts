import { syncInvestments } from '@repo/data-ops/plaid/service';
import { SyncInvestmentsMessageType } from '@repo/data-ops/zod-schema/queue';

export async function handleSyncInvestments(
  env: Env,
  event: SyncInvestmentsMessageType,
) {
  const { accountId, userId, plaidAccountId, plaidAccessToken } = event.data;

  try {
    const result = await syncInvestments(
      userId,
      plaidAccessToken,
      accountId,
      plaidAccountId,
      {
        PLAID_CLIENT_ID: env.PLAID_CLIENT_ID,
        PLAID_SECRET: env.PLAID_SECRET,
        PLAID_ENV: env.PLAID_ENV,
      },
    );

    console.log(
      `Synced ${result.holdingsCount} holdings and ${result.transactionsCount} investment transactions for account ${accountId}`,
    );

    return result;
  } catch (error) {
    console.error('Error syncing investments:', error);
    throw error;
  }
}
