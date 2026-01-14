import { t } from "@/worker/trpc/trpc-instance";
import { z } from "zod";
import {
  createGoalSchema,
  updateGoalSchema,
} from "@repo/data-ops/zod-schema/finance";
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  getGoalProgress,
  calculateGoalProjection,
} from "@repo/data-ops/queries/goals";
import { TRPCError } from "@trpc/server";

export const goalsTrpcRoutes = t.router({
  list: t.procedure
    .input(z.object({ includeCompleted: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      return await getGoals(ctx.userInfo.userId, input.includeCompleted);
    }),

  create: t.procedure.input(createGoalSchema).mutation(async ({ ctx, input }) => {
    return await createGoal({
      ...input,
      userId: ctx.userInfo.userId,
    });
  }),

  getById: t.procedure
    .input(z.object({ goalId: z.string() }))
    .query(async ({ ctx, input }) => {
      const goal = await getGoalById(input.goalId, ctx.userInfo.userId);
      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });
      }
      return goal;
    }),

  update: t.procedure.input(updateGoalSchema).mutation(async ({ ctx, input }) => {
    await updateGoal({
      ...input,
      userId: ctx.userInfo.userId,
    });
  }),

  updateProgress: t.procedure
    .input(
      z.object({
        goalId: z.string(),
        currentAmount: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateGoalProgress(
        input.goalId,
        ctx.userInfo.userId,
        input.currentAmount,
      );
    }),

  delete: t.procedure
    .input(z.object({ goalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await deleteGoal(input.goalId, ctx.userInfo.userId);
    }),

  getProgress: t.procedure
    .input(
      z.object({
        goalId: z.string(),
        startDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getGoalProgress(
        input.goalId,
        ctx.userInfo.userId,
        input.startDate,
      );
    }),

  getProjection: t.procedure
    .input(z.object({ goalId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await calculateGoalProjection(input.goalId, ctx.userInfo.userId);
    }),

  // Get all goals with their progress
  listWithProgress: t.procedure.query(async ({ ctx }) => {
    const goals = await getGoals(ctx.userInfo.userId, false);

    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const projection = await calculateGoalProjection(
          goal.goalId,
          ctx.userInfo.userId,
        );

        return {
          ...goal,
          progressPercent:
            goal.targetAmount > 0
              ? ((goal.currentAmount || 0) / goal.targetAmount) * 100
              : 0,
          projection,
        };
      }),
    );

    return goalsWithProgress;
  }),
});
