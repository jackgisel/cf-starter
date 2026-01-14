import { t } from "@/worker/trpc/trpc-instance";
import { z } from "zod";
import {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
  syncInvestments,
  syncAccountBalances,
} from "@repo/data-ops/plaid/service";
import { Products } from "plaid";

export const plaidTrpcRoutes = t.router({
  createLinkToken: t.procedure
    .input(
      z.object({
        products: z
          .array(z.enum(["auth", "transactions", "investments", "liabilities", "identity"]))
          .default(["auth", "transactions", "investments"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const linkToken = await createLinkToken(
        ctx.userInfo.userId,
        input.products as Products[],
        {
          PLAID_CLIENT_ID: ctx.env.PLAID_CLIENT_ID,
          PLAID_SECRET: ctx.env.PLAID_SECRET,
          PLAID_ENV: ctx.env.PLAID_ENV,
          PLAID_WEBHOOK_URL: ctx.env.PLAID_WEBHOOK_URL,
        },
      );

      return linkToken;
    }),

  exchangePublicToken: t.procedure
    .input(
      z.object({
        publicToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await exchangePublicToken(
        input.publicToken,
        ctx.userInfo.userId,
        {
          PLAID_CLIENT_ID: ctx.env.PLAID_CLIENT_ID,
          PLAID_SECRET: ctx.env.PLAID_SECRET,
          PLAID_ENV: ctx.env.PLAID_ENV,
        },
      );

      return result;
    }),

  syncTransactions: t.procedure
    .input(
      z.object({
        accountId: z.string(),
        plaidAccountId: z.string(),
        accessToken: z.string(),
        cursor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await syncTransactions(
        ctx.userInfo.userId,
        input.accessToken,
        input.accountId,
        input.plaidAccountId,
        {
          PLAID_CLIENT_ID: ctx.env.PLAID_CLIENT_ID,
          PLAID_SECRET: ctx.env.PLAID_SECRET,
          PLAID_ENV: ctx.env.PLAID_ENV,
        },
        input.cursor,
      );

      return result;
    }),

  syncInvestments: t.procedure
    .input(
      z.object({
        accountId: z.string(),
        plaidAccountId: z.string(),
        accessToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await syncInvestments(
        ctx.userInfo.userId,
        input.accessToken,
        input.accountId,
        input.plaidAccountId,
        {
          PLAID_CLIENT_ID: ctx.env.PLAID_CLIENT_ID,
          PLAID_SECRET: ctx.env.PLAID_SECRET,
          PLAID_ENV: ctx.env.PLAID_ENV,
        },
      );

      return result;
    }),

  syncBalances: t.procedure
    .input(
      z.object({
        plaidItemId: z.string(),
        accessToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await syncAccountBalances(
        ctx.userInfo.userId,
        input.plaidItemId,
        input.accessToken,
        {
          PLAID_CLIENT_ID: ctx.env.PLAID_CLIENT_ID,
          PLAID_SECRET: ctx.env.PLAID_SECRET,
          PLAID_ENV: ctx.env.PLAID_ENV,
        },
      );

      return result;
    }),
});
