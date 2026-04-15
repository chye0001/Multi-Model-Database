import type { EmbeddedUser } from "../users/User.dto.ts";

export type Closet = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  userId: string; // the owner of the closet
  itemIds: number[];
  sharedWith: EmbeddedUser[];
  fromDatabase?: string;
}