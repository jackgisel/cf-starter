import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaidLinkButton } from "@/components/finance/plaid-link-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Wallet, CreditCard, FileText, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/_authed/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const { data: groupedAccounts, isLoading } =
    trpc.accounts.getGroupedByType.useQuery();
  const { data: totalBalances } = trpc.accounts.getTotalBalances.useQuery();

  const [syncing, setSyncing] = useState(false);
  const utils = trpc.useUtils();

  const handleRefresh = async () => {
    setSyncing(true);
    try {
      await utils.accounts.list.invalidate();
      await utils.accounts.getTotalBalances.invalidate();
      await utils.accounts.getGroupedByType.invalidate();
      toast.success("Accounts refreshed");
    } catch (error) {
      toast.error("Failed to refresh accounts");
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const hasAnyAccounts =
    (groupedAccounts?.depository.length || 0) > 0 ||
    (groupedAccounts?.investment.length || 0) > 0 ||
    (groupedAccounts?.credit.length || 0) > 0 ||
    (groupedAccounts?.loan.length || 0) > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your linked accounts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <PlaidLinkButton variant="default" />
        </div>
      </div>

      {/* Summary Cards */}
      {hasAnyAccounts && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Banking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalBalances?.depository.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {groupedAccounts?.depository.length} account(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Investments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalBalances?.investment.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {groupedAccounts?.investment.length} account(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalBalances?.credit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {groupedAccounts?.credit.length} account(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalBalances?.loan.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {groupedAccounts?.loan.length} account(s)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts by Type */}
      <Tabs defaultValue="banking" className="w-full">
        <TabsList>
          <TabsTrigger value="banking">
            <Wallet className="h-4 w-4 mr-2" />
            Banking
          </TabsTrigger>
          <TabsTrigger value="investments">
            <Building2 className="h-4 w-4 mr-2" />
            Investments
          </TabsTrigger>
          <TabsTrigger value="credit">
            <CreditCard className="h-4 w-4 mr-2" />
            Credit
          </TabsTrigger>
          <TabsTrigger value="loans">
            <FileText className="h-4 w-4 mr-2" />
            Loans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banking" className="space-y-4">
          <AccountList
            accounts={groupedAccounts?.depository || []}
            type="depository"
          />
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <AccountList
            accounts={groupedAccounts?.investment || []}
            type="investment"
          />
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          <AccountList accounts={groupedAccounts?.credit || []} type="credit" />
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <AccountList accounts={groupedAccounts?.loan || []} type="loan" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountList({
  accounts,
  type,
}: {
  accounts: any[];
  type: string;
}) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            No {type} accounts linked yet
          </p>
          <PlaidLinkButton variant="outline" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <Card key={account.accountId}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{account.accountName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {account.institutionName}
                </p>
              </div>
              <Badge variant="secondary">{account.accountSubtype || type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Current Balance
              </p>
              <p className="text-2xl font-bold">
                ${account.currentBalance?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </p>
            </div>

            {account.availableBalance !== null &&
              account.availableBalance !== account.currentBalance && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Available Balance
                  </p>
                  <p className="text-lg font-semibold">
                    ${account.availableBalance?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </p>
                </div>
              )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Account •••{account.mask}</span>
              <span>
                {account.lastSynced
                  ? new Date(parseInt(account.lastSynced)).toLocaleDateString()
                  : "Never synced"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
