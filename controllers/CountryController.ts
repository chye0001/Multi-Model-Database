import type { Request, Response } from 'express';
import type { CountryService } from '../services/CountryService.js';

export class CountryController {
  constructor(private countryService: CountryService) {}

  getAllCountries = async (req: Request, res: Response) => {
    const countries = await this.countryService.getAllCountries();
    res.send(countries);
  };

  getCountryByCode = async (req: Request, res: Response) => {
    try {
      const countries = await this.countryService.getCountryByCode(req.params.code!);
      if (countries.length === 0) return res.status(404).send({ error: 'Country not found' });
      res.send(countries);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  createCountry = async (req: Request, res: Response) => {
    try {
      const { name, countryCode } = req.body;
      if (!name || !countryCode) {
        return res.status(400).send({ error: 'name and countryCode are required' });
      }
      const country = await this.countryService.createCountry({ name, countryCode });
      res.status(201).send(country);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to create country' });
    }
  };

  deleteCountry = async (req: Request, res: Response) => {
    try {
      await this.countryService.deleteCountry(req.params.code!);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to delete country' });
    }
  };

  getCountryBrands = async (req: Request, res: Response) => {
    const brands = await this.countryService.getCountryBrands(req.params.code!);
    res.send(brands);
  };
}
