import { neogma } from "../neogma-client.js";

export async function deleteEmptyClosets(): Promise<void> {
    console.log("🧹  Running Neo4j empty closet cleanup...");

    try {
        await neogma.queryRunner.run(`
      MATCH (c:Closet)
      WHERE NOT EXISTS {
        MATCH (c)-[:STORES]->(:Item)
      }
      DETACH DELETE c
    `);

        console.log("Empty closets deleted from Neo4j.");
    } catch (error) {
        console.error(" Failed to delete empty closets from Neo4j:", error);
        throw error;
    }
}
