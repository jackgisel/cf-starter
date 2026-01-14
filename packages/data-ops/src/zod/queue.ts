import { z } from "zod";

// Base queue message schema
const BaseQueueMessageSchema = z.object({
  type: z.string(),
  data: z.unknown(),
});

// Email queue message schema
export const LinkClickMessageSchema = BaseQueueMessageSchema.extend({
  type: z.literal("LINK_CLICK"),
  data: z.object({
    id: z.string(),
    country: z.string().optional(),
    destination: z.string(),
    accountId: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    timestamp: z.string(),
  }),
});

// Finance queue message schemas
export const SyncTransactionsMessageSchema = z.object({
  type: z.literal("SYNC_TRANSACTIONS"),
  data: z.object({
    accountId: z.string(),
    userId: z.string(),
    plaidItemId: z.string(),
    plaidAccountId: z.string(),
    plaidAccessToken: z.string(),
    cursor: z.string().optional(),
  }),
});

export const SyncInvestmentsMessageSchema = z.object({
  type: z.literal("SYNC_INVESTMENTS"),
  data: z.object({
    accountId: z.string(),
    userId: z.string(),
    plaidItemId: z.string(),
    plaidAccountId: z.string(),
    plaidAccessToken: z.string(),
  }),
});

export const SyncBalancesMessageSchema = z.object({
  type: z.literal("SYNC_BALANCES"),
  data: z.object({
    userId: z.string(),
    plaidItemId: z.string(),
    plaidAccessToken: z.string(),
  }),
});

export const QueueMessageSchema = z.discriminatedUnion("type", [
  LinkClickMessageSchema,
  SyncTransactionsMessageSchema,
  SyncInvestmentsMessageSchema,
  SyncBalancesMessageSchema,
]);

export type LinkClickMessageType = z.infer<typeof LinkClickMessageSchema>;
export type SyncTransactionsMessageType = z.infer<typeof SyncTransactionsMessageSchema>;
export type SyncInvestmentsMessageType = z.infer<typeof SyncInvestmentsMessageSchema>;
export type SyncBalancesMessageType = z.infer<typeof SyncBalancesMessageSchema>;
export type QueueMessageType = z.infer<typeof QueueMessageSchema>;
