import { t } from "@/worker/trpc/trpc-instance";
import { linksTrpcRoutes } from "@/worker/trpc/routers/links";
import { evaluationsTrpcRoutes } from "@/worker/trpc/routers/evaluations";
import { accountsTrpcRoutes } from "@/worker/trpc/routers/accounts";
import { transactionsTrpcRoutes } from "@/worker/trpc/routers/transactions";
import { investmentsTrpcRoutes } from "@/worker/trpc/routers/investments";
import { goalsTrpcRoutes } from "@/worker/trpc/routers/goals";
import { plaidTrpcRoutes } from "@/worker/trpc/routers/plaid";

export const appRouter = t.router({
  links: linksTrpcRoutes,
  evaluations: evaluationsTrpcRoutes,
  accounts: accountsTrpcRoutes,
  transactions: transactionsTrpcRoutes,
  investments: investmentsTrpcRoutes,
  goals: goalsTrpcRoutes,
  plaid: plaidTrpcRoutes,
});

export type AppRouter = typeof appRouter;
