import { App, LogLevel } from "@slack/bolt";
import FT from "./lib/ft";
import fs from "fs";
import path from "path";
import type FTypes from "./lib/ft.d"
const apiKeysFile = path.join(__dirname, "../cache/apiKeys.json");
const cacheDir = path.join(__dirname, "../cache");
const app = new App({
    signingSecret: process.env.SIGNING_SECRET,
    token: process.env.BOT_TOKEN,
    appToken: process.env.APP_TOKEN,
    socketMode: process.env.APP_TOKEN ? process.env.SOCKET_MODE === "true" : false,
    customRoutes: [
        {
            path: '/healthcheck',
            method: ['GET'],
            handler: (req, res) => {
                res.writeHead(200);
                res.end("I'm okay!");
            }
        }
    ]
});

let clients: Record<string, FT> = {};

function loadApiKeys(): Record<string, {
    channel: string;
    projects: string[];
}> {
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    if (!fs.existsSync(apiKeysFile)) {
        fs.writeFileSync(apiKeysFile, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(apiKeysFile, "utf-8"));
}

async function getNewDevlogs(apiKey: string, projectId: string): Promise<{ name: string, devlogs: FTypes.Devlog[] } | void> {
    const cacheFile = path.join(cacheDir, `${projectId}.json`);

    let cachedIds: any[] = [];
    if (fs.existsSync(cacheFile)) {
        try {
            cachedIds = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        } catch (err) {
            console.error(`Error reading cache for project ${projectId}:`, err);
        }
    }

    try {
        const client = clients[apiKey];
        if (!client) return console.error(`No FT client for project ${projectId}`);

        const project = await client.project({ id: Number(projectId) });
        if (!project) return console.error("No project exists at id", projectId)
        const devlogIds = Array.isArray(project?.devlog_ids) ? project.devlog_ids : [];
        const cachedSet = new Set(cachedIds);
        const newIds = devlogIds.filter(id => !cachedSet.has(id));
        if (newIds.length === 0) return;
        const devlogs: any[] = [];
        for (const id of newIds) {
            const res = await client.devlog({ projectId: Number(projectId), devlogId: id });
            if (res) devlogs.push(res);
        }

        if (cachedIds.length === 0) {
            cachedIds.push(...newIds);
            fs.writeFileSync(cacheFile, JSON.stringify(cachedIds, null, 2));
            return { name: project.title, devlogs: [] }
        } else {
            cachedIds.push(...newIds);
            fs.writeFileSync(cacheFile, JSON.stringify(cachedIds, null, 2));
            return { name: project.title, devlogs }
        }
    } catch (err) {
        console.error(`Error fetching devlogs for project ${projectId}:`, err);
        return;
    }
}

async function checkAllProjects() {
    const apiKeys = loadApiKeys();
    if (!apiKeys) return;
    for (const [apiKey] of Object.entries(apiKeys)) {
        if (!clients[apiKey]) {
            clients[apiKey] = new FT(apiKey);
        }
    }

    for (const [apiKey, data] of Object.entries(apiKeys)) {
        for (const projectId of data.projects) {
            const newDevlogs = await getNewDevlogs(apiKey, projectId);
            if (!newDevlogs || newDevlogs.devlogs.length === 0) continue;
            for (const devlog of newDevlogs.devlogs) {
                try {
                    const days = Math.floor(devlog.duration_seconds / (24 * 3600));
                    const hours = Math.floor((devlog.duration_seconds % (24 * 3600)) / 3600);
                    const minutes = Math.floor((devlog.duration_seconds % 3600) / 60);
                    let durationParts = [];
                    if (days > 0) durationParts.push(`${days} day${days > 1 ? 's' : ''}`);
                    if (hours > 0) durationParts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
                    if (minutes > 0) durationParts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
                    const durationString = durationParts.join(' ');
                    const createdAt = new Date(devlog.created_at);
                    const timestamp = createdAt.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

                    await app.client.chat.postMessage({
                        channel: data.channel,
                        blocks: [
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: `:shipitparrot: <https://flavortown.hackclub.com/projects/${projectId}|${newDevlogs.name}> got a new devlog posted! :shipitparrot:`
                                }
                            },
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: `> ${devlog.body}`
                                }
                            },
                            {
                                "type": "divider"
                            },
                            {
                                "type": "context",
                                "elements": [
                                    {
                                        "type": "mrkdwn",
                                        "text": `Devlog created at ${timestamp} and took ${durationString}.`
                                    }
                                ]
                            }
                        ]
                    });
                } catch (err) {
                    console.error(`Error posting to Slack for project ${projectId}:`, err);
                }
            }
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}

function loadHandlers(app: App, folder: string, type: "command" | "view") {
    const folderPath = path.join(__dirname, folder);
    fs.readdirSync(folderPath).forEach(file => {
        if (!file.endsWith(".ts") && !file.endsWith(".js")) return;

        const module = require(path.join(folderPath, file)).default;

        if (!module?.name || typeof module.execute !== "function") return;

        // @ts-ignore
        app[type](module.name, async (args) => {
            try {
                await module.execute(args, { loadApiKeys });
            } catch (err) {
                console.error(`Error executing ${type} ${module.name}:`, err);
            }
        });

        console.log(`[Logpheus] Registered ${type}: ${module.name}`);
    });
}

loadHandlers(app, "commands", "command");
loadHandlers(app, "views", "view");

app.command(process.env.DEV_MODE === "true" ? '/devlpheus-stats' : '/logpheus-stats', async ({ command, ack, respond, logger }) => {
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
});

(async () => {
    try {
        app.logger.setName("[Logpheus]")
        app.logger.setLevel('error' as LogLevel);

        if (process.env.SOCKET_MODE === "true" && process.env.APP_TOKEN) {
            await app.start();
            console.info('[Logpheus] Running as Socket Mode');
        } else {
            const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
            await app.start(port);
            console.info('[Logpheus] Running on port:', port);
        }

        checkAllProjects()
        setInterval(checkAllProjects, 60 * 1000);
    } catch (error) {
        console.error('Unable to start app:', error);
    }
})();
