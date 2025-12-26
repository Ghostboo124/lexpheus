import type { AckFn, RespondArguments, RespondFn, Logger, SlashCommand } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";

export default {
    name: process.env.DEV_MODE === "true" ? '/devlpheus-add' : '/logpheus-add',
    execute: async ({ command, ack, client, respond, logger }: {
        command: SlashCommand,
        ack: AckFn<string | RespondArguments>,
        client: WebClient,
        respond: RespondFn,

        logger: Logger
    }, { loadApiKeys }: {
        loadApiKeys: () => Record<string, {
            channel: string;
            projects: string[];
        }>
    }) => {
        try {
            await ack();
            const apiKeys = loadApiKeys();
            const userCount = Object.keys(apiKeys).length;
            await respond(`There is ${userCount} api keys in use.`);
        } catch (error: any) {
            if (error.code === "slack_webapi_platform_error" && error.data?.error === "channel_not_found") {
                await ack("If you are running this in a private channel then you have to add bot manually first to the channel. CHANNEL_NOT_FOUND");
                return;
            }

            logger.error(error);
            await ack("An unexpected error occurred. Check logs.");
        }
    }
}