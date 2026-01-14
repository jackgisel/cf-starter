import { t } from "@/worker/trpc/trpc-instance";
import { z } from "zod";
import {
  getAccounts,
  getAccountById,
  getAccountsByType,
} from "@repo/data-ops/queries/accounts";
import { syncAccountBalances } from "@repo/data-ops/plaid/service";
import { TRPCError } from "@trpc/server";

export const accountsTrpcRoutes = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return await getAccounts(ctx.userInfo.userId);
  }),

  getById: t.procedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      const account = await getAccountById(input.accountId, ctx.userInfo.userId);
      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }
      return account;
    }),

  getByType: t.procedure
    .input(
      z.object({
        accountType: z.enum(["depository", "investment", "credit", "loan", "other"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getAccountsByType(ctx.userInfo.userId, input.accountType);
    }),

  syncBalances: t.procedure
    .input(
      z.object({
        plaidItemId: z.string(),
        accessToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await syncAccountBalances(
        ctx.userInfo.userId,
        input.plaidItemId,
        input.accessToken,
        {
          PLAID_CLIENT_ID: ctx.env.PLAID_CLIENT_ID,
          PLAID_SECRET: ctx.env.PLAID_SECRET,
          PLAID_ENV: ctx.env.PLAID_ENV,
        },
      );
    }),

  // Get accounts grouped by type
  getGroupedByType: t.procedure.query(async ({ ctx }) => {
    const accounts = await getAccounts(ctx.userInfo.userId);

    const grouped = {
      depository: accounts.filter((a) => a.accountType === "depository"),
      investment: accounts.filter((a) => a.accountType === "investment"),
      credit: accounts.filter((a) => a.accountType === "credit"),
      loan: accounts.filter((a) => a.accountType === "loan"),
      other: accounts.filter((a) => a.accountType === "other"),
    };

    return grouped;
  }),

  // Get total balances
  getTotalBalances: t.procedure.query(async ({ ctx }) => {
    const accounts = await getAccounts(ctx.userInfo.userId);

    const totals = {
      depository: 0,
      investment: 0,
      credit: 0,
      loan: 0,
      netWorth: 0,
    };

    accounts.forEach((account) => {
      const balance = account.currentBalance || 0;

      switch (account.accountType) {
        case "depository":
          totals.depository += balance;
          totals.netWorth += balance;
          break;
        case "investment":
          totals.investment += balance;
          totals.netWorth += balance;
          break;
        case "credit":
          totals.credit += Math.abs(balance); // Credit balances are typically negative
          totals.netWorth -= Math.abs(balance);
          break;
        case "loan":
          totals.loan += Math.abs(balance);
          totals.netWorth -= Math.abs(balance);
          break;
      }
    });

    return totals;
  }),
});
