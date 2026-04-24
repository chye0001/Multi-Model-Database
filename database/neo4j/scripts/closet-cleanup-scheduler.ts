import cron from "node-cron";
import { deleteEmptyClosets } from "./delete-empty-closets.js";

let cleanupTask: cron.ScheduledTask | null = null;

export function startNeo4jClosetCleanupScheduler(): void {
    if (cleanupTask) return;

    // Runs every day at 02:00
    cleanupTask = cron.schedule(
        "0 2 * * *",
        async () => {
            try {
                await deleteEmptyClosets();
            } catch (error) {
                console.error("Neo4j closet cleanup job failed:", error);
            }
        },
        {
            timezone: "Europe/Copenhagen",
        }
    );

    console.log("Neo4j empty closet scheduler started (daily at 02:00).");
}

export function stopNeo4jClosetCleanupScheduler(): void {
    if (!cleanupTask) return;

    cleanupTask.stop();
    cleanupTask.destroy();
    cleanupTask = null;

    console.log("Neo4j empty closet scheduler stopped.");
}
