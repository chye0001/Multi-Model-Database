export type Image = {
    id: number;
    url: string;
    itemId: number;
    fromDatabase?: string;
};

export type CreateImageRequest = {
    url: string;
    itemId: string;
};
