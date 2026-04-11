import type { Country } from "../countries/Country.dto.ts";


export type Brand = {
  id: number;
  name: string;
  country?: Country;
  fromDatabase?: string;
}