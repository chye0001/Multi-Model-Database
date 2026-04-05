export type Review = {
  id?: number | null | undefined;
  score: number;
  text: string;
  dateWritten: Date;
  outfitId?: number;
  writtenBy: string; // userId
  fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
}