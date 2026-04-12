import type { Request, Response } from 'express';
import type { BrandService } from '../services/BrandService.js';

export class BrandController {
  constructor(private brandService: BrandService) {}

  getAllBrands = async (req: Request, res: Response) => {
    try {
      const countryCode = req.query.country as string | undefined;
      const brands = await this.brandService.getAllBrands(countryCode);
      res.send(brands);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  getBrandByName = async (req: Request, res: Response) => {
    try {
      const brands = await this.brandService.getBrandByName(req.params.name);
      if (brands.length === 0) return res.status(404).send({ error: 'Brand not found' });
      res.send(brands);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };

  createBrand = async (req: Request, res: Response) => {
    try {
      const { name, countryCode } = req.body;
      if (!name || !countryCode) return res.status(400).send({ error: 'name and countryCode are required' });
      const brand = await this.brandService.createBrand({ name, countryCode });
      res.status(201).send(brand);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to create brand' });
    }
  };

  updateBrand = async (req: Request, res: Response) => {
    try {
      const { newName } = req.body;
      if (!newName) return res.status(400).send({ error: 'newName is required' });
      const brand = await this.brandService.updateBrand(req.params.name, newName);
      if (brand.length === 0) return res.status(404).send({ error: 'Brand not found' });
      res.send(brand);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to update brand' });
    }
  };

  deleteBrand = async (req: Request, res: Response) => {
    try {
      await this.brandService.deleteBrand(req.params.name);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to delete brand' });
    }
  };

  getBrandItems = async (req: Request, res: Response) => {
    try {
      const items = await this.brandService.getBrandItems(req.params.name);
      res.send(items);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Internal Server Error' });
    }
  };
}
