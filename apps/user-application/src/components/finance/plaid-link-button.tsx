import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}

export function PlaidLinkButton({
  onSuccess,
  variant = "default",
  className,
}: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Create link token mutation
  const createLinkTokenMutation = trpc.plaid.createLinkToken.useMutation({
    onSuccess: (data) => {
      setLinkToken(data.link_token);
    },
    onError: (error) => {
      toast.error("Failed to initialize Plaid Link", {
        description: error.message,
      });
    },
  });

  // Exchange public token mutation
  const exchangeTokenMutation = trpc.plaid.exchangePublicToken.useMutation({
    onSuccess: async () => {
      toast.success("Account linked successfully!");

      // Invalidate accounts query to refetch
      await utils.accounts.list.invalidate();

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error("Failed to link account", {
        description: error.message,
      });
    },
  });

  // Plaid Link configuration
  const config = {
    token: linkToken,
    onSuccess: (publicToken: string) => {
      exchangeTokenMutation.mutate({ publicToken });
    },
    onExit: (err: any) => {
      if (err != null) {
        toast.error("Link session ended", {
          description: err.display_message || "Please try again",
        });
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  // Initialize link token when button is clicked
  const handleClick = useCallback(() => {
    if (!linkToken) {
      createLinkTokenMutation.mutate({
        products: ["auth", "transactions", "investments"],
      });
    } else {
      open();
    }
  }, [linkToken, createLinkTokenMutation, open]);

  // Auto-open when link token is ready
  const isReady = ready && linkToken;
  if (isReady && !createLinkTokenMutation.isPending) {
    setTimeout(() => open(), 100);
  }

  const isLoading =
    createLinkTokenMutation.isPending || exchangeTokenMutation.isPending;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      className={className}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Connecting..." : "Link Account"}
    </Button>
  );
}
