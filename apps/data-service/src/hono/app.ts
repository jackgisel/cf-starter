import { getDestinationForCountry, getRoutingDestinations } from '@/helpers/routing-ops';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';
import { Hono } from 'hono';

export const App = new Hono<{ Bindings: Env }>();

App.get('/:id', async (c) => {
	const shortLinkId = c.req.param('id');

	const linkInfo = await getRoutingDestinations(c.env, shortLinkId);
	if (!linkInfo) {
		return c.text('Link not found', 404);
	}

	const cfHeaders = cloudflareInfoSchema.safeParse(c.req.raw.cf);
	if (!cfHeaders.success) {
		// TODO: Maybe just route to the default location
		return c.text('Invalid Cloudflare headers', 400);
	}

	const { country } = cfHeaders.data;

	const destination = getDestinationForCountry(linkInfo, country);

	// Async Processing
	const message: LinkClickMessageType = {
		type: 'LINK_CLICK',
		data: {
			id: shortLinkId,
			country,
			destination,
			accountId: linkInfo.accountId,
			latitude: cfHeaders.data.latitude,
			longitude: cfHeaders.data.longitude,
			timestamp: new Date().toISOString(),
		},
	};
	c.executionCtx.waitUntil(c.env.queue.send(message));

	return c.redirect(destination);
});
