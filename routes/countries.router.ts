import { Router } from 'express';
import { countryRepositoryFactory } from '../repositories/factories/CountryRepositoryFactory.js';
import { CountryService } from '../services/CountryService.js';
import { CountryController } from '../controllers/CountryController.js';
import { hasRole } from '../middleware/rbac.middleware.ts';

const router = Router();

const countryRepository = countryRepositoryFactory();
const countryService = new CountryService(countryRepository);
const countryController = new CountryController(countryService);

router.get('/', countryController.getAllCountries);
router.get('/:code', countryController.getCountryByCode);
router.post('/', hasRole(["admin"]), countryController.createCountry);
router.delete('/:code', hasRole(["admin"]), countryController.deleteCountry);

router.get('/:code/brands', countryController.getCountryBrands);

export default router;
