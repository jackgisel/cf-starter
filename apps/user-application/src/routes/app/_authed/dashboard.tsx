import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaidLinkButton } from "@/components/finance/plaid-link-button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Wallet, Target } from "lucide-react";

export const Route = createFileRoute("/app/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: totalBalances, isLoading: isLoadingBalances } =
    trpc.accounts.getTotalBalances.useQuery();

  const { data: investmentOverview, isLoading: isLoadingInvestments } =
    trpc.investments.getOverview.useQuery();

  const { data: goals, isLoading: isLoadingGoals } =
    trpc.goals.listWithProgress.useQuery();

  const { data: accounts } = trpc.accounts.list.useQuery();

  const hasAccounts = accounts && accounts.length > 0;

  if (!hasAccounts) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Welcome to Your Finance Dashboard</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your bank accounts and investment accounts to get started tracking
            your finances.
          </p>
          <PlaidLinkButton variant="default" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your financial overview at a glance
          </p>
        </div>
        <PlaidLinkButton variant="outline" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingBalances ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  $
                  {totalBalances?.netWorth.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total assets minus liabilities
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investment Portfolio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingInvestments ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  $
                  {investmentOverview?.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {investmentOverview && investmentOverview.totalGainLossPercent !== 0
                    ? `${investmentOverview.totalGainLossPercent > 0 ? "+" : ""}${investmentOverview.totalGainLossPercent.toFixed(2)}% total return`
                    : "No investments yet"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cash & Checking
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingBalances ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  $
                  {totalBalances?.depository.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available in bank accounts
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingGoals ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{goals?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {goals && goals.length > 0
                    ? `${goals.filter((g) => g.projection?.onTrack).length} on track`
                    : "No goals set"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts && accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.slice(0, 5).map((account) => (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{account.accountName}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.accountType} •••{account.mask}
                      </p>
                    </div>
                    <p className="font-semibold">
                      $
                      {account.currentBalance?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No accounts linked yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {goals && goals.length > 0 ? (
              <div className="space-y-3">
                {goals.slice(0, 5).map((goal) => (
                  <div key={goal.goalId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-muted-foreground">
                        {goal.progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No goals set yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
