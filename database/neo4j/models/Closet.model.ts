import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

import { getItemModel } from "./Item.model.js";
import type { ItemInstance } from "./Item.model.js";

import { getOutfitModel } from "./Outfit.model.js";
import type { OutfitInstance } from "./Outfit.model.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface ClosetProperties {
  /** Surrogate integer key. Unique + not null. */
  id: number;
  /** Display name, e.g. "Summer 2025". Not null. */
  name: string;
  /** Optional longer description. */
  description?: string;
  /** Whether other users can see this closet. Defaults to false. */
  isPublic: boolean;

  [key: string]: any;
}

export interface ClosetRelatedNodes {
  /**
   * Closet -[:STORES]-> Item  (many-to-many)
   * A closet stores many items; an item can be in many closets.
   */
  items: ModelRelatedNodesI<
    ReturnType<typeof getItemModel>,
    ItemInstance
  >;
  /**
   * Closet -[:CREATES]-> Outfit  (one-to-many; relationship carries createdAt)
   * The CREATES relationship records when a closet "produced" an outfit.
   * Analogy: like a join-table with an extra column in SQL.
   */
  outfits: ModelRelatedNodesI<
    ReturnType<typeof getOutfitModel>,
    OutfitInstance,
    // CreateRelationshipProperties — what you supply when creating the rel
    { createdAt: string },
    // RelationshipProperties — what is actually stored on the rel in Neo4j
    { createdAt: string }
  >;
}

export type ClosetInstance = NeogmaInstance<ClosetProperties, ClosetRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _ClosetModel: ReturnType<typeof buildClosetModel> | null = null;

function buildClosetModel() {
  return ModelFactory<ClosetProperties, ClosetRelatedNodes>(
    {
      label: "Closet",
      schema: {
        id: {
          type: "number",
          unique: true,
          required: true,
        },
        name: {
          type: "string",
          minLength: 1,
          required: true,
        },
        description: {
          type: "string",
          required: false,
        },
        isPublic: {
          type: "boolean",
          required: true,
        },
      },
      primaryKeyField: "id",
      relationships: {
        // (Closet)-[:STORES]->(Item)
        items: {
          model: getItemModel(),
          name: "STORES",
          direction: "out",
        },
        // (Closet)-[:CREATES {createdAt}]->(Outfit)
        outfits: {
          model: getOutfitModel(),
          name: "CREATES",
          direction: "out",
          properties: {
            createdAt: {
              property: "createdAt",
              schema: {
                type: "string",
                required: true,
              },
            },
          },
        },
      },
    },
    neogma
  );
}

export function getClosetModel() {
  if (!_ClosetModel) _ClosetModel = buildClosetModel();
  return _ClosetModel;
}

export const ClosetModel = new Proxy({} as ReturnType<typeof buildClosetModel>, {
  get(_target, prop) {
    return (getClosetModel() as Record<string, unknown>)[prop as string];
  },
});
