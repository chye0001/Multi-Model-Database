export function isRepositoriesEnabled(enabledRepos: unknown[]): void {
    if (enabledRepos.length === 0) {
        throw new Error("No repositories enabled");
    }
}