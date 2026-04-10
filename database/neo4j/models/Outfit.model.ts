import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

import { getItemModel } from "./Item.model.js";
import type { ItemInstance } from "./Item.model.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface OutfitProperties {
  /** Surrogate integer key. Unique + not null. */
  id: number;
  /** Display name of the outfit. Optional per diagram. */
  name?: string;
  /** Style tag, e.g. "casual", "formal". Optional. */
  style?: string;

  [key: string]: any;
}

export interface OutfitRelatedNodes {
  /**
   * Outfit -[:CONTAINS]-> Item  (many-to-many)
   * An outfit contains multiple items; an item can belong to many outfits.
   */
  items: ModelRelatedNodesI<
    ReturnType<typeof getItemModel>,
    ItemInstance
  >;
}

export type OutfitInstance = NeogmaInstance<OutfitProperties, OutfitRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _OutfitModel: ReturnType<typeof buildOutfitModel> | null = null;

function buildOutfitModel() {
  return ModelFactory<OutfitProperties, OutfitRelatedNodes>(
    {
      label: "Outfit",
      schema: {
        id: {
          type: "number",
          unique: true,
          required: true,
        },
        name: {
          type: "string",
          required: false,
        },
        style: {
          type: "string",
          required: false,
        },
      },
      primaryKeyField: "id",
      relationships: {
        // (Outfit)-[:CONTAINS]->(Item)
        items: {
          model: getItemModel(),
          name: "CONTAINS",
          direction: "out",
        },
      },
    },
    neogma
  );
}

export function getOutfitModel() {
  if (!_OutfitModel) _OutfitModel = buildOutfitModel();
  return _OutfitModel;
}

export const OutfitModel = new Proxy({} as ReturnType<typeof buildOutfitModel>, {
  get(_target, prop) {
    return (getOutfitModel() as Record<string, unknown>)[prop as string];
  },
});
