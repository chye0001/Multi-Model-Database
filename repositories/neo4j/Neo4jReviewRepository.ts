import { neogma } from "../../database/neo4j/neogma-client.js";
import { formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IReviewRepository } from "../interfaces/IReviewRepository.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";

export class Neo4jReviewRepository implements IReviewRepository {
    async getAllReviews(): Promise<Review[]> {
        const result = await neogma.queryRunner.run(
            `MATCH (rv:Review)-[:ABOUT]->(o:Outfit)
             OPTIONAL MATCH (u:User)-[w:WRITES]->(rv)
             RETURN rv, o.id AS outfitId, u.id AS writtenBy, w.dateWritten AS dateWritten`
        );
        return result.records.map((record) => formatUserReview(record, "neo4j"));
    }

    async getReviewById(id: string): Promise<Review[]> {
        const reviewId = this.parseNumericId(id, "review id");
        const result = await neogma.queryRunner.run(
            `MATCH (rv:Review { id: $id })-[:ABOUT]->(o:Outfit)
             OPTIONAL MATCH (u:User)-[w:WRITES]->(rv)
             RETURN rv, o.id AS outfitId, u.id AS writtenBy, w.dateWritten AS dateWritten`,
            { id: reviewId }
        );
        if (result.records.length === 0) return [];
        return result.records.map((record) => formatUserReview(record, "neo4j"));
    }

    async createReview(data: { score: number; text: string; outfitId: string; writtenBy: string }): Promise<Review[]> {
        const outfitId = this.parseNumericId(data.outfitId, "outfit id");

        const maxResult = await neogma.queryRunner.run(
            `MATCH (rv:Review) RETURN coalesce(max(rv.id), 0) AS maxId`
        );
        const rawMax = maxResult.records[0]?.get("maxId");
        const nextId = this.toNumber(rawMax) + 1;
        const dateWritten = new Date().toISOString();

        const created = await neogma.queryRunner.run(
            `MATCH (u:User { id: $userId })
             MATCH (o:Outfit { id: $outfitId })
             CREATE (rv:Review { id: $id, score: $score, text: $text })
             CREATE (u)-[:WRITES { dateWritten: $dateWritten }]->(rv)
             CREATE (rv)-[:ABOUT]->(o)
             RETURN rv, o.id AS outfitId, u.id AS writtenBy, $dateWritten AS dateWritten`,
            {
                id: nextId,
                score: data.score,
                text: data.text,
                userId: data.writtenBy,
                outfitId,
                dateWritten,
            }
        );

        if (created.records.length === 0) {
            throw new Error("User or outfit not found for review creation");
        }

        return created.records.map((record) => formatUserReview(record, "neo4j"));
    }

    async updateReview(id: string, data: Partial<{ score: number; text: string }>): Promise<Review[]> {
        const reviewId = this.parseNumericId(id, "review id");
        const patch: Partial<{ score: number; text: string }> = {};

        if (typeof data.score === "number") patch.score = data.score;
        if (typeof data.text === "string") patch.text = data.text;

        await neogma.queryRunner.run(
            `MATCH (rv:Review { id: $id })
             SET rv += $patch`,
            { id: reviewId, patch }
        );

        return this.getReviewById(id);
    }

    async deleteReview(id: string): Promise<void> {
        const reviewId = this.parseNumericId(id, "review id");
        await neogma.queryRunner.run(
            `MATCH (rv:Review { id: $id })
             DETACH DELETE rv`,
            { id: reviewId }
        );
    }

    async getOutfitReviews(outfitId: string): Promise<Review[]> {
        const numericOutfitId = this.parseNumericId(outfitId, "outfit id");
        const result = await neogma.queryRunner.run(
            `MATCH (rv:Review)-[:ABOUT]->(o:Outfit { id: $outfitId })
             OPTIONAL MATCH (u:User)-[w:WRITES]->(rv)
             RETURN rv, o.id AS outfitId, u.id AS writtenBy, w.dateWritten AS dateWritten`,
            { outfitId: numericOutfitId }
        );
        return result.records.map((record) => formatUserReview(record, "neo4j"));
    }

    async getUserReviews(userId: string): Promise<Review[]> {
        const result = await neogma.queryRunner.run(
            `MATCH (u:User { id: $userId })-[w:WRITES]->(rv:Review)-[:ABOUT]->(o:Outfit)
             RETURN rv, o.id AS outfitId, u.id AS writtenBy, w.dateWritten AS dateWritten`,
            { userId }
        );
        return result.records.map((record) => formatUserReview(record, "neo4j"));
    }

    private parseNumericId(value: string, fieldName: string): number {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${fieldName}: "${value}"`);
        }
        return parsed;
    }

    private toNumber(value: unknown): number {
        if (typeof value === "number") return value;
        if (typeof value === "bigint") return Number(value);
        if (value && typeof (value as { toNumber?: () => number }).toNumber === "function") {
            return (value as { toNumber: () => number }).toNumber();
        }
        const n = Number(value ?? 0);
        return Number.isFinite(n) ? n : 0;
    }
}
