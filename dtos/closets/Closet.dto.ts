export type Closet = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  userId: string;
  itemIds: number[];
  sharedWith: string[];
  fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
}

export type SharedCloset = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  userId: string; // userId of the owner of the closet
  sharedWith: string[]; // array of userIds that the closet is shared with
  itemIds: number[];
  fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
}