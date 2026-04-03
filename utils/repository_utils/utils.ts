import type { IUserRepository } from '../../repositories/interfaces/IUserRepository.js';

export function isRepositoriesEnabled(enabledRepos: IUserRepository[]): void {
    if (enabledRepos.length === 0) {
        throw new Error("No repositories enabled");
    }
}