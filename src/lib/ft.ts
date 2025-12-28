import axios, { type AxiosInstance } from "axios";
import type * as FTypes from "./ft.d";

export default class FT {
    private apiToken: string;
    private fetch: AxiosInstance;
    private ready: Promise<void>;

    constructor(apiToken: string) {
        if (apiToken.length === 0) throw new Error("Flavortown API Key is required")
        this.apiToken = apiToken;
        this.fetch = axios.create({
            baseURL: "https://flavortown.hackclub.com/api/v1",
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                "X-Flavortown-Ext-1865": true
            },
        })
        this.ready = Promise.resolve();
    }

    async projects(query?: FTypes.ProjectsQuery): Promise<FTypes.Projects | void> {
        await this.ready;
        const queryString = new URLSearchParams();
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryString.append(key, String(value));
                }
            });
        }

        return this.fetch.get("/projects")
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }

    async project(param: FTypes.ProjectParam): Promise<FTypes.Project | void> {
        await this.ready;
        return this.fetch.get("/projects/" + param.id)
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }

    async devlogs(param: FTypes.ProjectParam, query?: FTypes.DevlogsQuery): Promise<FTypes.Devlogs | void> {
        await this.ready;
        const queryString = new URLSearchParams();
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryString.append(key, String(value));
                }
            });
        }

        return this.fetch.get("/projects/" + param.id + "/devlogs")
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }

    async devlog(param: FTypes.DevlogParam, query?: FTypes.DevlogsQuery): Promise<FTypes.Devlog | void> {
        await this.ready;
        return this.fetch.get("/projects/" + param.projectId + "/devlogs/" + param.devlogId)
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }
}