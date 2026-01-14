import { t } from "@/worker/trpc/trpc-instance";
import {
  transactionListQuerySchema,
} from "@repo/data-ops/zod-schema/finance";
import {
  getTransactions,
  getTransactionById,
  getSpendingByMerchant,
  getSpendingByCategory,
  getMonthlySpending,
} from "@repo/data-ops/queries/transactions";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const transactionsTrpcRoutes = t.router({
  list: t.procedure
    .input(transactionListQuerySchema)
    .query(async ({ ctx, input }) => {
      return await getTransactions(ctx.userInfo.userId, input);
    }),

  getById: t.procedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const transaction = await getTransactionById(
        input.transactionId,
        ctx.userInfo.userId,
      );
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      }
      return transaction;
    }),

  // Analytics
  spendingByMerchant: t.procedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getSpendingByMerchant(
        ctx.userInfo.userId,
        input.startDate,
        input.endDate,
        input.limit,
      );
    }),

  spendingByCategory: t.procedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getSpendingByCategory(
        ctx.userInfo.userId,
        input.startDate,
        input.endDate,
      );
    }),

  monthlySpending: t.procedure
    .input(z.object({ months: z.number().default(12) }))
    .query(async ({ ctx, input }) => {
      return await getMonthlySpending(ctx.userInfo.userId, input.months);
    }),
});
