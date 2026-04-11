import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

import { getRoleModel } from "./Role.model.js";
import type { RoleInstance } from "./Role.model.js";

import { getCountryModel } from "./Country.model.js";
import type { CountryInstance } from "./Country.model.js";

import { getClosetModel } from "./Closet.model.js";
import type { ClosetInstance } from "./Closet.model.js";

import { getReviewModel } from "./Review.model.js";
import type { ReviewInstance } from "./Review.model.js";

import { getOutfitModel} from "./Outfit.model.js";
import type { OutfitInstance } from "./Outfit.model.js";



//─────────────────────────────────────────────────────────────────────────────────────────
// Interfaces
//─────────────────────────────────────────────────────────────────────────────────────────

export interface UserProperties {
  /** Surrogate string key. Unique + not null. */
  id: string;
  /** Not null. */
  firstName: string;
  /** Not null. */
  lastName: string;
  /** Unique + not null. Used for login / lookup. */
  email: string;
    
  password: string;

  createdAt: string;

  [key: string]: any;
}

/**
 * Relationship properties on the (User)-[:HAS]->(Closet) edge.
 * The diagram shows `createdAt: datetime` on that relationship.
 */
export interface UserHasClosetRelProps {
  /** ISO-8601 string; stored as string in Neo4j (no native DateTime in Neogma schema). */
  createdAt: string;
}

/**
 * Relationship properties on the (User)-[:WRITES]->(Review) edge.
 * The diagram shows `dateWritten: datetime`.
 */
export interface UserWritesReviewRelProps {
  dateWritten: string;
}

export interface UserRelatedNodes {
  /**
   * User -[:HAS]-> Role  (many-to-one)
   * Each user has one role; a role can be assigned to many users.
   */
  role: ModelRelatedNodesI<
    ReturnType<typeof getRoleModel>,
    RoleInstance
  >;

  /**
   * User -[:IS_FROM]-> Country  (many-to-one)
   */
  country: ModelRelatedNodesI<
    ReturnType<typeof getCountryModel>,
    CountryInstance
  >;

  /**
   * User -[:HAS {createdAt}]-> Closet  (one-to-many)
   * The relationship carries a `createdAt` timestamp.
   *
   * Neogma requires the property key in CreateRelationshipProperties
   * to match what you pass in `.relateTo()` / createOne nested data.
   */
  closets: ModelRelatedNodesI<
    ReturnType<typeof getClosetModel>,
    ClosetInstance,
    UserHasClosetRelProps,  // what caller provides when creating the rel
    UserHasClosetRelProps   // what is stored on the rel in Neo4j
  >;

  sharedClosets: ModelRelatedNodesI<
    ReturnType<typeof getClosetModel>,
    ClosetInstance
  >;

  /**
   * User -[:WRITES {dateWritten}]-> Review  (one-to-many)
   */
  reviews: ModelRelatedNodesI<
    ReturnType<typeof getReviewModel>,
    ReviewInstance,
    UserWritesReviewRelProps,
    UserWritesReviewRelProps
  >;

  /**
   * User -[:CREATES]-> Outfit  (one-to-many)
   * The diagram shows CREATES going from User → Outfit directly as well
   * (in addition to Closet → Outfit). Both paths are valid in a graph.
   */
  outfits: ModelRelatedNodesI<
    ReturnType<typeof getOutfitModel>,
    OutfitInstance
  >;
}

export type UserInstance = NeogmaInstance<UserProperties, UserRelatedNodes>;






//──────────────────────────────────────────────────────────────────────────────────────────
// Model Definition
//──────────────────────────────────────────────────────────────────────────────────────────

let _UserModel: ReturnType<typeof buildUserModel> | null = null;

function buildUserModel() {
  return ModelFactory<UserProperties, UserRelatedNodes>(
    {
      label: "User",
      schema: {
        id: {
          type: "string",
          unique: true,
          required: true,
        },
        firstName: {
          type: "string",
          minLength: 1,
          required: true,
        },
        lastName: {
          type: "string",
          minLength: 1,
          required: true,
        },
        email: {
          type: "string",
          format: "email",
          required: true,
        },
        password: {
          type: "string",
          required: true,
        },
        createdAt: {
          type: "string",
          // 'date-time' is a built-in JSON schema format for ISO 8601
          format: "date-time", 
          required: true,
        },
      },
      primaryKeyField: "id",
      relationships: {
        // (User)-[:HAS]->(Role)
        role: {
          model: getRoleModel(),
          name: "HAS",
          direction: "out",
        },
        // (User)-[:IS_FROM]->(Country)
        country: {
          model: getCountryModel(),
          name: "IS_FROM",
          direction: "out",
        },
        // (User)-[:CREATES {createdAt}]->(Closet)
        closets: {
          model: getClosetModel(),
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

        sharedClosets: {
          model: getClosetModel(),
          name: "CO_CURATES",
          direction: "out",
        },

        // (User)-[:WRITES {dateWritten}]->(Review)
        reviews: {
          model: getReviewModel(),
          name: "WRITES",
          direction: "out",
          properties: {
            dateWritten: {
              property: "dateWritten",
              schema: {
                type: "string",
                required: true,
              },
            },
          },
        },
        // (User)-[:CREATES]->(Outfit)
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

export function getUserModel() {
  if (!_UserModel) _UserModel = buildUserModel();
  return _UserModel;
}

export const UserModel = new Proxy({} as ReturnType<typeof buildUserModel>, {
  get(_target, prop) {
    return (getUserModel() as Record<string, unknown>)[prop as string];
  },
});
