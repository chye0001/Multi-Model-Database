import cron from "node-cron";
import { deleteEmptyClosetsMongo } from "./delete-empty-closets.js";

let cleanupTask: cron.ScheduledTask | null = null;

export function startMongoClosetCleanupScheduler(): void {
    if (cleanupTask) return;

    // Daily at 02:00
    cleanupTask = cron.schedule(
        "0 2 * * *",
        async () => {
            try {
                await deleteEmptyClosetsMongo();
            } catch (error) {
                console.error("[mongo-cleanup] Scheduled job failed:", error);
            }
        },
        {
            timezone: "Europe/Copenhagen",
        }
    );

    console.log("[mongo-cleanup] Scheduler started (daily at 02:00)");
}

export function stopMongoClosetCleanupScheduler(): void {
    if (!cleanupTask) return;

    cleanupTask.stop();
    cleanupTask.destroy();
    cleanupTask = null;

    console.log("[mongo-cleanup] Scheduler stopped");
}
