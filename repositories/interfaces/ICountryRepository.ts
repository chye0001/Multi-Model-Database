import type { Country } from "../../dtos/countries/Country.dto.js";
import type { Brand } from "../../dtos/brands/Brand.dto.js";

export interface ICountryRepository {
  getAllCountries(): Promise<Country[]>;
  getCountryByCode(code: string): Promise<Country[]>;
  createCountry(data: { name: string; countryCode: string }): Promise<Country[]>;
  deleteCountry(code: string): Promise<void>;

  getCountryBrands(code: string): Promise<Brand[]>;
}
