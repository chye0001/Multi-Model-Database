import type { EmbeddedUser } from "../users/User.dto.ts";



export type Review = {
  id?: number | null | undefined;
  score: number;
  text: string;
  dateWritten: Date;
  outfitId?: number;
  writtenBy: EmbeddedUser;   // was string (userId), now user snapshot
  fromDatabase?: string;
}
