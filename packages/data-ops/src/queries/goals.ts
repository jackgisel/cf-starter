import { getDb } from "@/db/database";
import { goals, goalProgress } from "@/drizzle-out/finance-schema";
import { CreateGoal, UpdateGoal } from "@/zod/finance";
import { eq, and, desc, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function createGoal(data: CreateGoal & { userId: string }) {
  const db = getDb();
  const goalId = nanoid(16);
  const now = Date.now().toString();

  await db.insert(goals).values({
    goalId,
    userId: data.userId,
    name: data.name,
    description: data.description,
    goalType: data.goalType,
    targetAmount: data.targetAmount,
    currentAmount: 0,
    targetDate: data.targetDate,
    linkedAccountIds: data.linkedAccountIds
      ? JSON.stringify(data.linkedAccountIds)
      : undefined,
    isCompleted: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Create initial progress entry
  await createGoalProgressEntry(goalId, data.userId, 0, new Date().toISOString().split('T')[0]);

  return goalId;
}

export async function getGoals(userId: string, includeCompleted: boolean = false) {
  const db = getDb();

  const conditions = [eq(goals.userId, userId)];

  if (!includeCompleted) {
    conditions.push(eq(goals.isCompleted, 0));
  }

  const result = await db
    .select()
    .from(goals)
    .where(and(...conditions))
    .orderBy(desc(goals.createdAt));

  return result;
}

export async function getGoalById(goalId: string, userId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(goals)
    .where(and(eq(goals.goalId, goalId), eq(goals.userId, userId)))
    .limit(1);

  return result[0] || null;
}

export async function updateGoal(data: UpdateGoal & { userId: string }) {
  const db = getDb();
  const now = Date.now().toString();

  const updateData: any = {
    updatedAt: now,
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount;
  if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;
  if (data.linkedAccountIds !== undefined) {
    updateData.linkedAccountIds = JSON.stringify(data.linkedAccountIds);
  }
  if (data.isCompleted !== undefined) {
    updateData.isCompleted = data.isCompleted ? 1 : 0;
    if (data.isCompleted) {
      updateData.completedAt = now;
    }
  }

  await db
    .update(goals)
    .set(updateData)
    .where(and(eq(goals.goalId, data.goalId), eq(goals.userId, data.userId)));
}

export async function updateGoalProgress(
  goalId: string,
  userId: string,
  currentAmount: number,
) {
  const db = getDb();
  const now = Date.now().toString();
  const today = new Date().toISOString().split('T')[0];

  // Update the goal's current amount
  await db
    .update(goals)
    .set({
      currentAmount,
      updatedAt: now,
    })
    .where(and(eq(goals.goalId, goalId), eq(goals.userId, userId)));

  // Create or update progress entry for today
  await createGoalProgressEntry(goalId, userId, currentAmount, today);

  // Check if goal is completed
  const goal = await getGoalById(goalId, userId);
  if (goal && currentAmount >= goal.targetAmount && !goal.isCompleted) {
    await db
      .update(goals)
      .set({
        isCompleted: 1,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(goals.goalId, goalId));
  }
}

export async function deleteGoal(goalId: string, userId: string) {
  const db = getDb();

  // Delete progress entries first
  await db
    .delete(goalProgress)
    .where(and(eq(goalProgress.goalId, goalId), eq(goalProgress.userId, userId)));

  // Delete goal
  await db
    .delete(goals)
    .where(and(eq(goals.goalId, goalId), eq(goals.userId, userId)));
}

// Goal Progress
export async function createGoalProgressEntry(
  goalId: string,
  userId: string,
  amount: number,
  date: string,
) {
  const db = getDb();
  const progressId = nanoid(16);
  const now = Date.now().toString();

  // Check if entry for this date already exists
  const existing = await db
    .select()
    .from(goalProgress)
    .where(
      and(
        eq(goalProgress.goalId, goalId),
        eq(goalProgress.date, date),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing entry
    return;
  }

  await db.insert(goalProgress).values({
    progressId,
    goalId,
    userId,
    amount,
    date,
    createdAt: now,
  });

  return progressId;
}

export async function getGoalProgress(
  goalId: string,
  userId: string,
  startDate?: string,
) {
  const db = getDb();

  const conditions = [
    eq(goalProgress.goalId, goalId),
    eq(goalProgress.userId, userId),
  ];

  if (startDate) {
    conditions.push(gte(goalProgress.date, startDate));
  }

  const result = await db
    .select()
    .from(goalProgress)
    .where(and(...conditions))
    .orderBy(desc(goalProgress.date))
    .limit(90); // Last 90 days

  return result;
}

export async function getRecentProgress(userId: string, days: number = 30) {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const result = await db
    .select({
      goal: goals,
      progress: goalProgress,
    })
    .from(goalProgress)
    .leftJoin(goals, eq(goalProgress.goalId, goals.goalId))
    .where(
      and(
        eq(goalProgress.userId, userId),
        gte(goalProgress.date, startDateStr),
      ),
    )
    .orderBy(desc(goalProgress.date));

  return result;
}

// Calculate projected completion date based on current trajectory
export async function calculateGoalProjection(goalId: string, userId: string) {
  const goal = await getGoalById(goalId, userId);
  if (!goal || goal.isCompleted) {
    return null;
  }

  // Get progress from last 30 days to calculate trend
  const progress = await getGoalProgress(goalId, userId);

  if (progress.length < 2) {
    return { projected: false, message: "Not enough data" };
  }

  // Calculate daily rate of change
  const oldest = progress[progress.length - 1];
  const newest = progress[0];
  const daysDiff = Math.abs(
    (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const amountDiff = newest.amount - oldest.amount;
  const dailyRate = amountDiff / daysDiff;

  if (dailyRate <= 0) {
    return { projected: false, message: "No positive progress detected" };
  }

  // Calculate days needed to reach target
  const remaining = goal.targetAmount - (goal.currentAmount || 0);
  const daysNeeded = Math.ceil(remaining / dailyRate);
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysNeeded);

  const onTrack = goal.targetDate
    ? projectedDate <= new Date(goal.targetDate)
    : true;

  return {
    projected: true,
    projectedDate: projectedDate.toISOString().split('T')[0],
    daysNeeded,
    dailyRate,
    onTrack,
  };
}
