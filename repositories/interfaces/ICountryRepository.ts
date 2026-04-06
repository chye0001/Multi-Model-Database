import type { Country } from "../../dtos/countries/Country.dto.js";
import type { Brand } from "../../dtos/brands/Brand.dto.js";

export interface ICountryRepository {
    getAllCountries(): Promise<Country[]>;
    getCountryById(id: number): Promise<Country | null>;
    createCountry(data: Partial<Country>): Promise<Country>;
    updateCountry(id: number, data: Partial<Country>): Promise<Country | null>;
    deleteCountry(id: number): Promise<void>;

    getCountryBrands(countryId: number): Promise<Brand[]>;
}