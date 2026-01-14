import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";

export const Route = createFileRoute("/app/_authed/investments")({
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const { data: overview, isLoading: isLoadingOverview } =
    trpc.investments.getOverview.useQuery();

  const { data: holdings, isLoading: isLoadingHoldings } =
    trpc.investments.getHoldings.useQuery({});

  const { data: investmentTransactions } =
    trpc.investments.getTransactions.useQuery({});

  if (isLoadingOverview || isLoadingHoldings) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const hasInvestments = holdings && holdings.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investments</h1>
        <p className="text-muted-foreground">
          Track your portfolio and investment performance
        </p>
      </div>

      {/* Overview Cards */}
      {hasInvestments && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${overview?.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Current portfolio value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Gain/Loss
              </CardTitle>
              {(overview?.totalGainLoss || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (overview?.totalGainLoss || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(overview?.totalGainLoss || 0) >= 0 ? "+" : ""}$
                {overview?.totalGainLoss.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                {(overview?.totalGainLossPercent || 0) >= 0 ? "+" : ""}
                {overview?.totalGainLossPercent.toFixed(2)}% return
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cost Basis
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${overview?.totalCostBasis.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Total amount invested
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Holdings
              </CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{holdings?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Unique positions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holdings & Transactions */}
      <Tabs defaultValue="holdings" className="w-full">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Security</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings && holdings.length > 0 ? (
                    holdings.map((holding) => {
                      const gainLoss =
                        (holding.holding.institutionValue || 0) -
                        (holding.holding.costBasis || 0);
                      const gainLossPercent =
                        holding.holding.costBasis && holding.holding.costBasis > 0
                          ? (gainLoss / holding.holding.costBasis) * 100
                          : 0;

                      return (
                        <TableRow key={holding.holding.holdingId}>
                          <TableCell className="font-medium">
                            {holding.security?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {holding.security?.ticker || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {holding.holding.quantity.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            $
                            {holding.holding.institutionPrice?.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            ) || "0.00"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            $
                            {holding.holding.institutionValue?.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            ) || "0.00"}
                          </TableCell>
                          <TableCell className="text-right">
                            $
                            {holding.holding.costBasis?.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            ) || "0.00"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              gainLoss >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {gainLoss >= 0 ? "+" : ""}$
                            {gainLoss.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            <span className="text-xs ml-1">
                              ({gainLoss >= 0 ? "+" : ""}
                              {gainLossPercent.toFixed(2)}%)
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <p className="text-muted-foreground">
                          No holdings found. Link an investment account to get
                          started.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Security</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investmentTransactions && investmentTransactions.length > 0 ? (
                    investmentTransactions.map((item) => (
                      <TableRow key={item.transaction.transactionId}>
                        <TableCell className="font-medium">
                          {new Date(item.transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge>{item.transaction.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.security?.name || item.transaction.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.transaction.quantity?.toFixed(4) || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.transaction.price
                            ? `$${item.transaction.price.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${item.transaction.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <p className="text-muted-foreground">
                          No investment transactions found
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {overview?.allocation && overview.allocation.length > 0 ? (
                <div className="space-y-4">
                  {overview.allocation.map((item) => {
                    const percentage =
                      overview.totalValue > 0
                        ? (item.totalValue / overview.totalValue) * 100
                        : 0;

                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {item.type || "Other"}
                          </span>
                          <span className="text-muted-foreground">
                            ${item.totalValue.toLocaleString()} (
                            {percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No allocation data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
