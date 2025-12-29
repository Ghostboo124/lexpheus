import type { AckFn, RespondArguments, Logger, SlashCommand } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";

export default {
    name: process.env.DEV_MODE === "true" ? '/devlpheus-config' : '/logpheus-config',
    execute: async ({ command, ack, client, logger }: {
        command: SlashCommand,
        ack: AckFn<string | RespondArguments>,
        client: WebClient,
        logger: Logger
    }, { loadApiKeys }: {
        loadApiKeys: () => Record<string, {
            channel: string;
            projects: string[];
        }>
    }) => {
        try {
            const channel = await client.conversations.info({
                channel: command.channel_id
            })
            if (!channel) return await ack("If you are running this in a private channel then you have to add bot manually first to the channel. CHANNEL_NOT_FOUND")
            if (command.user_id !== channel.channel?.creator) return await ack("You can only run this command in a channel that you are the creator of");
            await ack()
            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'logpheus_config',
                    title: {
                        type: 'plain_text',
                        text: command.channel_id
                    },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'ftApiKey',
                            label: {
                                type: 'plain_text',
                                text: "What is the new flavortown api key?"
                            },
                            element: {
                                type: 'plain_text_input',
                                action_id: 'api_input',
                                multiline: false
                            }
                        }
                    ],
                    submit: {
                        type: 'plain_text',
                        text: 'Submit'
                    }
                }
            });
        } catch (error: any) {
            if (error.code === "slack_webapi_platform_error" && error.data?.error === "channel_not_found") {
                await ack("If you are running this in a private channel then you have to add bot manually first to the channel. CHANNEL_NOT_FOUND");
                return;
            }

            logger.error(error);
            await ack("An unexpected error occurred. Check logs.");
        }
    }
};
