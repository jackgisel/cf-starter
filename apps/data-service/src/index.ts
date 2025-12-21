import { WorkerEntrypoint } from 'cloudflare:workers';
import { App as HonoApp } from './hono/app';
import { initDatabase } from '@repo/data-ops/database';
import { QueueMessageSchema } from '@repo/data-ops/zod-schema/queue';
import { handleLinkClick } from './queueHandlers/linkClicksHandler';

export default class DataService extends WorkerEntrypoint<Env> {
	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
		initDatabase(env.db);
	}

	fetch(request: Request) {
		return HonoApp.fetch(request, this.env, this.ctx);
	}

	async queue(batch: MessageBatch<unknown>) {
		for (const message of batch.messages) {
			const parsedMessage = QueueMessageSchema.safeParse(message.body);

			if (!parsedMessage.success) {
				console.error('Invalid message:', parsedMessage.error);
				continue;
			} else {
				const event = parsedMessage.data;

				if (event.type === 'LINK_CLICK') {
					await handleLinkClick(this.env, event);
				}
			}
		}
	}
}
