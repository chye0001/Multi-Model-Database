import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

import { getBrandModel } from "./Brand.model.js";
import type { BrandInstance } from "./Brand.model.js";

import { getCategoryModel } from "./Category.model.js";
import type { CategoryInstance } from "./Category.model.js";

import { getImageModel } from "./Image.model.js";
import type { ImageInstance } from "./Image.model.js";

import { getCountryModel } from "./Country.model.js";
import type { CountryInstance } from "./Country.model.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface ItemProperties {
  /** Surrogate integer key. Unique + not null. */
  id: number;
  /** Display name of the item. Optional per diagram. */
  name?: string;
  /**
   * Price stored as a number (Neo4j has no dedicated decimal type;
   * use number and enforce decimal rounding in application logic).
   */
  price?: number;

  [key: string]: any;
}

/**
 * RelatedNodes type — think of this as the "JOIN table" declarations
 * in a JPA @ManyToOne / @OneToMany mapping, but for a graph.
 *
 * Each key becomes an *alias* you pass to `.findMany({ include: [...] })`
 * or `.relateTo({ alias: '...' })`.
 */
export interface ItemRelatedNodes {
  /** Item -[:HAS]-> Brand  (many-to-one: many items share a brand) */
  brand: ModelRelatedNodesI<
    ReturnType<typeof getBrandModel>,
    BrandInstance
  >;
  /** Item -[:BELONGS_TO]-> Category  (many-to-one) */
  category: ModelRelatedNodesI<
    ReturnType<typeof getCategoryModel>,
    CategoryInstance
  >;
  /** Item -[:HAS]-> Image  (one-to-many: an item can have multiple images) */
  images: ModelRelatedNodesI<
    ReturnType<typeof getImageModel>,
    ImageInstance
  >;
  /** Item -[:IS_FROM]-> Country  (many-to-one) */
  country: ModelRelatedNodesI<
    ReturnType<typeof getCountryModel>,
    CountryInstance
  >;
}

export type ItemInstance = NeogmaInstance<ItemProperties, ItemRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _ItemModel: ReturnType<typeof buildItemModel> | null = null;

function buildItemModel() {
  return ModelFactory<ItemProperties, ItemRelatedNodes>(
    {
      label: "Item",
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
        price: {
          type: "number",
          minimum: 0,
          required: false,
        },
      },
      primaryKeyField: "id",
      relationships: {
        // direction: "out" means (Item)-[:MADE_BY]->(Brand)
        brand: {
          model: getBrandModel(),
          name: "MADE_BY",
          direction: "out",
        },
        category: {
          model: getCategoryModel(),
          name: "BELONGS_TO",
          direction: "out",
        },
        images: {
          model: getImageModel(),
          name: "HAS",
          direction: "out",
        },
        country: {
          model: getCountryModel(),
          name: "IS_FROM",
          direction: "out",
        },
      },
    },
    neogma
  );
}

export function getItemModel() {
  if (!_ItemModel) _ItemModel = buildItemModel();
  return _ItemModel;
}

export const ItemModel = new Proxy({} as ReturnType<typeof buildItemModel>, {
  get(_target, prop) {
    return (getItemModel() as Record<string, unknown>)[prop as string];
  },
});
