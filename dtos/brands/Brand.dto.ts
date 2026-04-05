import type { Country } from "../countries/Country.dto.js";


export type Brand = {
  id: number;
  name: string;
  country?: Country;
}