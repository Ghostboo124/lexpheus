import type { AckFn, ViewOutput, RespondArguments } from "@slack/bolt";
import type { WebClient, } from "@slack/web-api";
import fs from "node:fs";
import path from "node:path";

export default {
    name: "logpheus_config",
    execute: async ({ ack, view, client }: {
        ack: AckFn<string | RespondArguments>
        view: ViewOutput
        client: WebClient
    }, { loadApiKeys }: {
        loadApiKeys: () => Record<string, {
            channel: string;
            projects: string[];
        }>
    }) => {
        const values = view.state.values;
        const apiKey = values.ftApiKey?.api_input?.value?.trim();
        const channelId = view.title.text;
        const userIdBlock = view.blocks.find(
            (block): block is { type: "section"; text: { text: string } } =>
                block.type === "section" && "text" in block
        );
        const userId = userIdBlock?.text?.text.slice("User: ".length);
        if (!channelId || !userId) return await ack("No channel or user id");
        if (!apiKey) return await ack('Flavortown API key is required');
        const apiKeys = loadApiKeys();
        const entry = Object.keys(apiKeys).find(key => apiKeys[key]!.channel === channelId);
        if (!entry) return await ack('No entry found for this channel ID');
        await ack()
        apiKeys[apiKey] = apiKeys[entry]!;
        delete apiKeys[entry];
        fs.writeFileSync(path.join(__dirname, "../../cache/apiKeys.json"), JSON.stringify(apiKeys, null, 2), "utf-8");

        return await client.chat.postEphemeral({
            channel: channelId,
            user: userId,
            text: "The api key has been updated."
        })
    }
};
