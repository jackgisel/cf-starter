import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let plaidClient: PlaidApi | null = null;

export function getPlaidClient(env: {
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENV?: string;
}): PlaidApi {
  if (!plaidClient) {
    const configuration = new Configuration({
      basePath:
        env.PLAID_ENV === "production"
          ? PlaidEnvironments.production
          : env.PLAID_ENV === "development"
            ? PlaidEnvironments.development
            : PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": env.PLAID_CLIENT_ID,
          "PLAID-SECRET": env.PLAID_SECRET,
        },
      },
    });

    plaidClient = new PlaidApi(configuration);
  }

  return plaidClient;
}
