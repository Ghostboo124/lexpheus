import type { AckFn, RespondArguments, RespondFn, Logger, SlashCommand } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import fs from "node:fs";
import path from "node:path";

export default {
    name: process.env.DEV_MODE === "true" ? '/devlpheus-remove' : '/logpheus-remove',
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
            const channel = await client.conversations.info({
                channel: command.channel_id
            })
            if (!channel) return await ack("If you are running this in a private channel then you have to add bot manually first to the channel. CHANNEL_NOT_FOUND")
            if (command.user_id !== channel.channel?.creator) return await respond("You can only run this command in a channel that you are the creator of");
            const apiKeys = loadApiKeys();
            const projectId = command.text.trim();

            if (projectId.length > 0) {
                if (!Number.isInteger(Number(projectId))) return await respond("Project ID must be a valid number.");
                for (const [apiToken, entry] of Object.entries(apiKeys)) {
                    if (entry.projects.includes(projectId)) {
                        entry.projects = entry.projects.filter(p => p !== projectId);

                        if (entry.projects.length === 0) {
                            delete apiKeys[apiToken];
                        }

                        delete apiKeys[projectId];
                        fs.writeFileSync(path.join(__dirname, "../../cache/apiKeys.json"), JSON.stringify(apiKeys, null, 2), "utf-8");
                        const cacheFilePath = path.join(path.join(__dirname, "../../cache"), `${projectId}.json`);

                        if (fs.existsSync(cacheFilePath)) {
                            fs.unlinkSync(cacheFilePath);
                        }

                        await respond(`Removed project ${projectId} from list.`)
                    }
                }
            } else {
                let foundKey: string | null = null;

                for (const [apiToken, entry] of Object.entries(apiKeys)) {
                    if (entry.channel === command.channel_id) {
                        foundKey = apiToken;
                        break;
                    }
                }

                if (!foundKey) return await respond("No API key found for this channel.");
                delete apiKeys[foundKey];
                fs.writeFileSync(path.join(__dirname, "../../cache/apiKeys.json"), JSON.stringify(apiKeys, null, 2), "utf-8");
                return await respond("Removed all projects for this channel.");
            }
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