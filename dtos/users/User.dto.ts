import type { Country } from "../countries/Country.dto.js";
import type { Role } from "../roles/Role.dto.js";



// partial user data as not all user data is needed.
export type EmbeddedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type User = {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  role: Role;
  country: Country;
  fromDatabase?: string;
}

export type CreateUserRequest = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  countryId: number;
}

export type UpdateUserRequest = {
  firstName: string;
  lastName: string;
  countryId: number;
  country?: any;
}
