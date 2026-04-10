import { ModelFactory } from "neogma";
import type { NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

/** Properties stored on a :Role node in Neo4j */
export interface RoleProperties {
  /** Business identifier — unique across all roles (e.g. "admin", "user"). */
  id: number;
  name: string;
  [key: string]: any;
}

/**
 * Relationships that Role participates in as a *source* node.
 * Role has no outgoing relationships in this schema, so this is empty.
 * It exists so the generic type-chain stays consistent across models.
 */
export type RoleRelatedNodes = Record<string, never>;

/** Fully hydrated Neogma instance type for Role */
export type RoleInstance = NeogmaInstance<RoleProperties, RoleRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _RoleModel: ReturnType<typeof buildRoleModel> | null = null;

function buildRoleModel() {
  return ModelFactory<RoleProperties, RoleRelatedNodes>(
    {
      label: "Role",
      // `schema` acts like Bean Validation annotations in Java —
      // Neogma will throw before writing to Neo4j if a rule is violated.
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
      // The field Neo4j will use as the node's primary key in
      // relationship-creation helpers (.relateTo, createOne with nested data).
      primaryKeyField: "id",
      relationships: {}, // Role has no outgoing relationships
    },
    neogma
  );
}

export function getRoleModel() {
  if (!_RoleModel) _RoleModel = buildRoleModel();
  return _RoleModel;
}

/** Convenience re-export so callers can write `RoleModel.findMany(...)` */
export const RoleModel = new Proxy({} as ReturnType<typeof buildRoleModel>, {
  get(_target, prop) {
    return (getRoleModel() as Record<string, unknown>)[prop as string];
  },
});
