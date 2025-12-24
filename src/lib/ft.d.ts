export type Devlog = {
    id: number;
    body: string;
    comments_count: number;
    duration_seconds: number;
    likes_count: number;
    scrapbook_url: string;
    created_at: string;
    updated_at: string;
}
export type DevlogParam = {
    projectId: number;
    devlogId: number;
}
export type Devlogs = {
    devlogs: Devlog[]
}
export type DevlogsQuery = {
    page?: number;
}

export type Project = {
    id: number;
    title: string;
    description: string;
    repo_url: string;
    demo_url: string;
    readme_url: string;
    created_at: string;
    updated_at: string;
}
export type ProjectParam = {
    id: number;
}
export type Projects = Project[];
export type ProjectsQuery = {
    page?: number;
    query?: string;
}

export type StoreItem = {
    id: number;
    name: string;
    description: string;
    limited: boolean;
    stock: number;
    type: string;
    show_in_carousel: boolean;
    accessory_tag: string;
    agh_contents: any[];
    attached_shop_items_ids?: number[];
    buyable_by_self: boolean;
    long_description: string;
    max_qty: number;
    one_per_person_ever: boolean;
    sale_percentage: number;
    image_url: string;
    enabled: {
        au: boolean;
        ca: boolean;
        eu: boolean;
        in: boolean;
        uk: boolean;
        us: boolean;
        xx: boolean;
    },
    ticket_cost: {
        base_cost: number;
        au: number;
        ca: number;
        eu: number;
        in: number;
        uk: number;
        us: number;
        xx: number;
    }
}
export type Store = StoreItem[];