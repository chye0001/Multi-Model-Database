import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";
import { getCountryModel, type CountryInstance } from "./index.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface BrandProperties {
  /** Brand name, e.g. "Nike". Unique + not null. */
  id: number;
  name: string;
  [key: string]: any;
}

export interface BrandRelatedNodes {
  country: ModelRelatedNodesI<
    ReturnType<typeof getCountryModel>,
    CountryInstance
  >;
}

export type BrandInstance = NeogmaInstance<BrandProperties, BrandRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _BrandModel: ReturnType<typeof buildBrandModel> | null = null;

function buildBrandModel() {
  return ModelFactory<BrandProperties, BrandRelatedNodes>(
    {
      label: "Brand",
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
      },
      primaryKeyField: "id",
      relationships: {
        country: {
          model: getCountryModel(),
          name: "IS_FROM",
          direction: "out",
        }
      },
    },
    neogma
  );
}

export function getBrandModel() {
  if (!_BrandModel) _BrandModel = buildBrandModel();
  return _BrandModel;
}

export const BrandModel = new Proxy({} as ReturnType<typeof buildBrandModel>, {
  get(_target, prop) {
    return (getBrandModel() as Record<string, unknown>)[prop as string];
  },
});
