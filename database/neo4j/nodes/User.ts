import { ModelFactory, Neogma } from "neogma";
import type { ModelRelatedNodesI, NeogmaModel, Neo4jSupportedProperties } from "neogma";

import { neogma } from "../neogma-client.js";



// 1. Properties interface
export interface UserProps extends Neo4jSupportedProperties {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

// 2. Related nodes interface — filled in after Review model exists
export interface UserRelatedNodes {
  Reviews: ModelRelatedNodesI<any, any>;
}

// 3. Type for the full model instance
export type UserInstance = NeogmaModel<UserProps, UserRelatedNodes>;



// 4. Factory function — lazy init so Neogma is ready before models are built
let UserModel: UserInstance;

export function getUser(neogma?: Neogma): UserInstance {
  if (UserModel) return UserModel;

  const n = neogma;

  UserModel = ModelFactory<UserProps, UserRelatedNodes>(
    {
      label: "User",
      schema: {
        id:        { type: "string",  required: true },
        email:     { type: "string",  required: true },
        firstName: { type: "string",  required: true },
        lastName:  { type: "string",  required: true },
        role:      { type: "string",  required: true, default: () => "user" },
        createdAt: { type: "string",  required: true, default: () => new Date().toISOString() },
      },
      primaryKeyField: "id",
      relationships: {
        Reviews: {
          model:      "Review",      // resolved by label string to avoid circular imports
          direction:  "out",
          name:       "WRITES",
          properties: {
            createdAt: { property: "createdAt", schema: { type: "string" } }
          }
        }
      }
    },
    n
  );

  return UserModel;
}