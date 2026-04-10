import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

import { getOutfitModel } from "./Outfit.model.js";
import type { OutfitInstance } from "./Outfit.model.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface ReviewProperties {
  /** Surrogate integer key. Unique + not null. */
  id: number;
  /** Numeric score (e.g. 1–5). Not null. */
  score: number;
  /** Review body text. Optional per diagram. */
  text?: string;

  [key: string]: any;
}

export interface ReviewRelatedNodes {
  /**
   * Review -[:ABOUT]-> Outfit  (many-to-one)
   * A review is about exactly one outfit; an outfit can have many reviews.
   */
  outfit: ModelRelatedNodesI<
    ReturnType<typeof getOutfitModel>,
    OutfitInstance
  >;
}

export type ReviewInstance = NeogmaInstance<ReviewProperties, ReviewRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _ReviewModel: ReturnType<typeof buildReviewModel> | null = null;

function buildReviewModel() {
  return ModelFactory<ReviewProperties, ReviewRelatedNodes>(
    {
      label: "Review",
      schema: {
        id: {
          type: "number",
          unique: true,
          required: true,
        },
        score: {
          type: "number",
          minimum: 1,
          maximum: 5,
          required: true,
        },
        text: {
          type: "string",
          required: false,
        },
      },
      primaryKeyField: "id",
      relationships: {
        // (Review)-[:ABOUT]->(Outfit)
        outfit: {
          model: getOutfitModel(),
          name: "ABOUT",
          direction: "out",
        },
      },
    },
    neogma
  );
}

export function getReviewModel() {
  if (!_ReviewModel) _ReviewModel = buildReviewModel();
  return _ReviewModel;
}

export const ReviewModel = new Proxy({} as ReturnType<typeof buildReviewModel>, {
  get(_target, prop) {
    return (getReviewModel() as Record<string, unknown>)[prop as string];
  },
});
