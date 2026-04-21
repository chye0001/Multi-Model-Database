import { isRepositoriesEnabled } from "../../utils/repository_utils/ErrorHandling.js";
import type { IImageRepository } from "../interfaces/IImageRepository.js";
import type { Image } from "../../dtos/images/Image.dto.js";

export class CompositeImageRepository implements IImageRepository {
    constructor(private enabledRepos: IImageRepository[]) {}

    async getImageById(id: string): Promise<Image[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.getImageById(id)));
        return results.flat();
    }

    async uploadImage(data: { url: string; itemId: string }): Promise<Image[]> {
        isRepositoriesEnabled(this.enabledRepos);
        const results = await Promise.all(this.enabledRepos.map((repo) => repo.uploadImage(data)));
        return results.flat();
    }

    async deleteImage(id: string): Promise<void> {
        isRepositoriesEnabled(this.enabledRepos);
        await Promise.all(this.enabledRepos.map((repo) => repo.deleteImage(id)));
    }
}
