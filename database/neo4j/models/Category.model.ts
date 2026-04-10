import { ModelFactory } from "neogma";
import type { NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface CategoryProperties {
  /** Category name, e.g. "Shoes". Unique + not null. */
  id: number;
  name: string;
  [key: string]: any;
}

export type CategoryRelatedNodes = Record<string, never>;

export type CategoryInstance = NeogmaInstance<CategoryProperties, CategoryRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _CategoryModel: ReturnType<typeof buildCategoryModel> | null = null;

function buildCategoryModel() {
  return ModelFactory<CategoryProperties, CategoryRelatedNodes>(
    {
      label: "Category",
      schema: {
         id: {
          type: "number",
          unique: true,
          required: true,
        },
        name: {
          type: "string",
          minLength: 1,
          unique: true,
          required: true,
        },
      },
      primaryKeyField: "id",
      relationships: {},
    },
    neogma
  );
}

export function getCategoryModel() {
  if (!_CategoryModel) _CategoryModel = buildCategoryModel();
  return _CategoryModel;
}

export const CategoryModel = new Proxy({} as ReturnType<typeof buildCategoryModel>, {
  get(_target, prop) {
    return (getCategoryModel() as Record<string, unknown>)[prop as string];
  },
});
