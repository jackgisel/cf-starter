import { WorkflowStep, WorkflowEntrypoint, WorkflowEvent } from "cloudflare:workers";

import { collectDestinationInfo } from "@/helpers/browser-render";
import { aiDestinationChecker } from "@/helpers/ai-destination-checker";
import { addEvaluation } from "@repo/data-ops/queries/evaluations";
import { initDatabase } from "@repo/data-ops/database";


export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<Env, DestinationStatusEvaluationParams> {

    async run(event: Readonly<WorkflowEvent<DestinationStatusEvaluationParams>>, step: WorkflowStep) {
        initDatabase(this.env.db)
        
        const collectedData = await step.do("Collect rendered destination page data", async () => {
            return collectDestinationInfo(this.env, event.payload.destinationUrl);
        });

        const aiStatus = await step.do("Use AI to check status of page", {
            retries: {
                limit: 0,
                delay: 0
            }
        }, async () => {
            return await aiDestinationChecker(this.env, collectedData.bodyText)
        })

        const evaluationId = await step.do('Save evaluation in database', async () => {
			return await addEvaluation({
				linkId: event.payload.linkId,
				status: aiStatus.status,
				reason: aiStatus.statusReason,
				accountId: event.payload.accountId,
				destinationUrl: event.payload.destinationUrl,
			});
		});

        await step.do('Backup evaluation HTML to R2', async () => {
            const accountId = event.payload.accountId;
            const r2PathHtml = `evaluations/${accountId}/html/${evaluationId}`;
            const r2PathBodyText = `evaluations/${accountId}/body-text/${evaluationId}`;
            const r2PathScreenshot = `evaluations/${accountId}/screenshot/${evaluationId}`;
            await this.env.r2.put(r2PathHtml, collectedData.html)
            await this.env.r2.put(r2PathBodyText, collectedData.bodyText)

            const base64Screenshot = collectedData.screenshotDataUrl.replace(/^data:image\/png;base64,/, '');
            const screenshotBuffer = Buffer.from(base64Screenshot, 'base64');
            await this.env.r2.put(r2PathScreenshot, screenshotBuffer)
        });
    }
}