import axios, { type AxiosInstance } from "axios";
import type * as FTypes from "./ft.d";
const apiUrl = "https://flavortown.hackclub.com/api/v1"
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
            },
        })
        this.ready = Promise.resolve();
    }

    async projects(query?: FTypes.ProjectsQuery) {
        await this.ready;
        const queryString = new URLSearchParams();
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryString.append(key, String(value));
                }
            });
        }

        return this.fetch.get<FTypes.Projects>("/projects")
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }

    async project(param: FTypes.ProjectParam) {
        await this.ready;
        return this.fetch.get<FTypes.Project>("/projects/" + param.id)
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }

    async devlogs(param: FTypes.ProjectParam, query?: FTypes.DevlogsQuery) {
        await this.ready;
        const queryString = new URLSearchParams();
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryString.append(key, String(value));
                }
            });
        }

        return this.fetch.get<FTypes.Devlogs>("/projects/" + param.id + "/devlogs")
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }

    async devlog(param: FTypes.DevlogParam, query?: FTypes.DevlogsQuery) {
        await this.ready;
        return this.fetch.get<FTypes.Devlogs>("/projects/" + param.projectId + "/devlogs/" + param.devlogId)
            .then((res) => {
                return res.data;
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
            });
    }
}