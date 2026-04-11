import type { Country } from "../countries/Country.dto.js";



export type User = {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  role: string;
  country: Country;
  fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
};

export type UpdateUserData = {
  firstName: string;
  lastName: string;
  countryId: number;
  country?: any;
}
