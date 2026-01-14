import { syncAccountBalances } from '@repo/data-ops/plaid/service';
import { SyncBalancesMessageType } from '@repo/data-ops/zod-schema/queue';

export async function handleSyncBalances(env: Env, event: SyncBalancesMessageType) {
  const { userId, plaidItemId, plaidAccessToken } = event.data;

  try {
    const result = await syncAccountBalances(
      userId,
      plaidItemId,
      plaidAccessToken,
      {
        PLAID_CLIENT_ID: env.PLAID_CLIENT_ID,
        PLAID_SECRET: env.PLAID_SECRET,
        PLAID_ENV: env.PLAID_ENV,
      },
    );

    console.log(`Synced balances for ${result.accountsUpdated} accounts in item ${plaidItemId}`);

    return result;
  } catch (error) {
    console.error('Error syncing account balances:', error);
    throw error;
  }
}
