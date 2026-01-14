import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, ArrowUpDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/_authed/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState<string | undefined>(
    undefined,
  );

  const { data: transactions, isLoading } = trpc.transactions.list.useQuery({
    searchTerm: searchTerm || undefined,
    accountId: accountFilter,
    limit: 100,
    offset: 0,
  });

  const { data: accounts } = trpc.accounts.list.useQuery();

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
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">View and search your transactions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by merchant or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={accountFilter || ""}
              onChange={(e) =>
                setAccountFilter(e.target.value || undefined)
              }
            >
              <option value="">All Accounts</option>
              {accounts?.map((account) => (
                <option key={account.accountId} value={account.accountId}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => {
                  const account = accounts?.find(
                    (a) => a.accountId === transaction.accountId,
                  );
                  const isExpense = transaction.amount > 0;

                  let category = "Uncategorized";
                  if (transaction.category) {
                    try {
                      const categories = JSON.parse(transaction.category);
                      category = categories[0] || "Uncategorized";
                    } catch {
                      category = transaction.category;
                    }
                  }

                  return (
                    <TableRow key={transaction.transactionId}>
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.merchantName || transaction.name}
                          </p>
                          {transaction.merchantName && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{account?.accountName}</p>
                          <p className="text-muted-foreground">
                            •••{account?.mask}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category}</Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          isExpense ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isExpense ? "-" : "+"}$
                        {Math.abs(transaction.amount).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.pending ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : (
                          <Badge variant="outline">Posted</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-muted-foreground">
                      No transactions found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {transactions && transactions.length >= 100 && (
        <div className="flex justify-center">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  );
}
