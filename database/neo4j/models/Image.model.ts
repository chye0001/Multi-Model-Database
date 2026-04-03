import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface ImageProperties {
  /** Stable unique identifier — uuid v4 generated at creation time. */
  imageId: string;
  /** Public URL of the image, e.g. a CDN link. Optional per diagram. */
  url?: string;
  [key: string]: any;
}

export type ImageRelatedNodes = Record<string, never>;

export type ImageInstance = NeogmaInstance<ImageProperties, ImageRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

/**
 * Image has no unique business key in the diagram, so we do NOT set
 * primaryKeyField here. In practice you may want to add a UUID `id` field
 * and use that as the PK — add it when the schema requires it.
 */
let _ImageModel: ReturnType<typeof buildImageModel> | null = null;

function buildImageModel() {
  return ModelFactory<ImageProperties, ImageRelatedNodes>(
    {
      label: "Image",
      schema: {
        imageId: {
          type: "string",
          required: true,
        },
        url: {
          type: "string",
          required: false,
        },
      },
      primaryKeyField: "imageId",
      relationships: {},
    },
    neogma
  );
}

export function getImageModel() {
  if (!_ImageModel) _ImageModel = buildImageModel();
  return _ImageModel;
}

export const ImageModel = new Proxy({} as ReturnType<typeof buildImageModel>, {
  get(_target, prop) {
    return (getImageModel() as Record<string, unknown>)[prop as string];
  },
});
