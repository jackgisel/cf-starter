import { t } from "@/worker/trpc/trpc-instance";
import { z } from "zod";
import {
  getHoldings,
  getInvestmentTransactions,
  getPortfolioValue,
  getAssetAllocation,
} from "@repo/data-ops/queries/investments";

export const investmentsTrpcRoutes = t.router({
  getOverview: t.procedure.query(async ({ ctx }) => {
    const portfolioValue = await getPortfolioValue(ctx.userInfo.userId);
    const allocation = await getAssetAllocation(ctx.userInfo.userId);

    return {
      totalValue: portfolioValue.totalValue || 0,
      totalCostBasis: portfolioValue.totalCostBasis || 0,
      totalGainLoss:
        (portfolioValue.totalValue || 0) - (portfolioValue.totalCostBasis || 0),
      totalGainLossPercent:
        portfolioValue.totalCostBasis && portfolioValue.totalCostBasis > 0
          ? (((portfolioValue.totalValue || 0) - portfolioValue.totalCostBasis) /
              portfolioValue.totalCostBasis) *
            100
          : 0,
      allocation,
    };
  }),

  getHoldings: t.procedure
    .input(z.object({ accountId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await getHoldings(ctx.userInfo.userId, input.accountId);
    }),

  getTransactions: t.procedure
    .input(
      z.object({
        accountId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getInvestmentTransactions(
        ctx.userInfo.userId,
        input.accountId,
        input.startDate,
        input.endDate,
      );
    }),

  getPortfolioValue: t.procedure
    .input(z.object({ accountId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await getPortfolioValue(ctx.userInfo.userId, input.accountId);
    }),

  getAssetAllocation: t.procedure.query(async ({ ctx }) => {
    return await getAssetAllocation(ctx.userInfo.userId);
  }),
});
