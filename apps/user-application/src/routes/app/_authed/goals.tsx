import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, TrendingUp, Calendar, CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/_authed/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { data: goals, isLoading } = trpc.goals.listWithProgress.useQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">
            Track progress towards your financial goals
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateGoalForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {goals && goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.goalId} goal={goal} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Set financial goals to track your progress and stay motivated
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: any }) {
  const progressPercent = goal.progressPercent || 0;
  const isCompleted = goal.isCompleted === 1;
  const projection = goal.projection;

  const getGoalIcon = (type: string) => {
    switch (type) {
      case "savings":
        return Target;
      case "net_worth":
        return TrendingUp;
      case "portfolio":
        return TrendingUp;
      case "debt_payoff":
        return CheckCircle2;
      default:
        return Target;
    }
  };

  const Icon = getGoalIcon(goal.goalType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{goal.name}</CardTitle>
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
          {isCompleted && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progressPercent.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(progressPercent, 100)} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span>
              ${(goal.currentAmount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-muted-foreground">
              of ${goal.targetAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            {goal.targetDate && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {projection?.projected && (
              <div className="flex items-center gap-1 text-sm">
                {projection.onTrack ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    On Track
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Behind
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Badge variant="secondary">{goal.goalType.replace("_", " ")}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateGoalForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState("savings");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const utils = trpc.useUtils();

  const createGoalMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Goal created successfully!");
      utils.goals.listWithProgress.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to create goal", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createGoalMutation.mutate({
      name,
      description: description || undefined,
      goalType: goalType as any,
      targetAmount: parseFloat(targetAmount),
      targetDate: targetDate || undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogDescription>
          Set a financial goal and track your progress towards it
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Goal Name*</Label>
          <Input
            id="name"
            placeholder="Emergency Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="6 months of expenses"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goalType">Goal Type*</Label>
          <select
            id="goalType"
            className="w-full px-3 py-2 border rounded-md"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            required
          >
            <option value="savings">Savings Goal</option>
            <option value="net_worth">Net Worth Goal</option>
            <option value="portfolio">Portfolio Value Goal</option>
            <option value="debt_payoff">Debt Payoff</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAmount">Target Amount*</Label>
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            placeholder="10000.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetDate">Target Date (optional)</Label>
          <Input
            id="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={createGoalMutation.isPending}
        >
          {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
        </Button>
      </form>
    </>
  );
}
