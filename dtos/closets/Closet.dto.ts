export type Closet = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  userId: string;        // userId of the owner of the closet
  itemIds: number[]; 
  sharedWith: string[];  // array of userIds that the closet is shared with
  fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
}
