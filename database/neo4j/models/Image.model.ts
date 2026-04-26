import { ModelFactory } from "neogma";
import type { ModelRelatedNodesI, NeogmaInstance } from "neogma";

import { neogma } from "../neogma-client.js";

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface ImageProperties {
  id: number;
  /** Public URL of the image, e.g. a CDN link. */
  url: string;
  [key: string]: any;
}

export type ImageRelatedNodes = Record<string, never>;

export type ImageInstance = NeogmaInstance<ImageProperties, ImageRelatedNodes>;

// ─────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────

let _ImageModel: ReturnType<typeof buildImageModel> | null = null;

function buildImageModel() {
  return ModelFactory<ImageProperties, ImageRelatedNodes>(
    {
      label: "Image",
      schema: {
        id: {
          type: "number",
          unique: true,
          required: true,
        },
        url: {
          type: "string",
          required: true,
        },
      },
      primaryKeyField: "id",
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
