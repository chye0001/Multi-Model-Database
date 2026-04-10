import { ModelFactory } from "neogma";
import type { NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface CountryProperties {
  id: number;
  /** Human-readable country name, e.g. "Denmark". Unique + not null. */
  name: string;
  /** ISO 3166-1 alpha-2 code, e.g. "DK". Unique + not null. */
  countryCode: string;
  [key: string]: any;
}

export type CountryRelatedNodes = Record<string, never>;

export type CountryInstance = NeogmaInstance<CountryProperties, CountryRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _CountryModel: ReturnType<typeof buildCountryModel> | null = null;

function buildCountryModel() {
  return ModelFactory<CountryProperties, CountryRelatedNodes>(
    {
      label: "Country",
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
          unique: true,
        },
        countryCode: {
          type: "string",
          minLength: 2,
          maxLength: 3,
          required: true,
          unique: true
        },
      },
      primaryKeyField: "id",
      relationships: {},
    },
    neogma
  );
}

export function getCountryModel() {
  if (!_CountryModel) _CountryModel = buildCountryModel();
  return _CountryModel;
}

export const CountryModel = new Proxy({} as ReturnType<typeof buildCountryModel>, {
  get(_target, prop) {
    return (getCountryModel() as Record<string, unknown>)[prop as string];
  },
});
