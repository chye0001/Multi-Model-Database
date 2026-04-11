import { Router } from 'express';
import { countryRepositoryFactory } from '../repositories/factories/CountryRepositoryFactory.js';
import { CountryService } from '../services/CountryService.js';
import { CountryController } from '../controllers/CountryController.js';

const router = Router();

const countryRepository = countryRepositoryFactory();
const countryService = new CountryService(countryRepository);
const countryController = new CountryController(countryService);

router.get('/', countryController.getAllCountries);
router.get('/:code', countryController.getCountryByCode);
router.post('/', countryController.createCountry);
router.delete('/:code', countryController.deleteCountry);

router.get('/:code/brands', countryController.getCountryBrands);

export default router;
