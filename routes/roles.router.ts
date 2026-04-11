import { Router } from 'express';
import { rolesRepositoryFactory } from '../repositories/factories/RolesRepositoryFactory.js';
import { RolesService } from '../services/RolesService.js';
import { RolesController } from '../controllers/RolesController.js';

const router = Router();

const rolesRepository = rolesRepositoryFactory();
const rolesService = new RolesService(rolesRepository);
const rolesController = new RolesController(rolesService);

router.get('/', rolesController.getAllRoles);
router.post('/', rolesController.createRole);
router.delete('/:name', rolesController.deleteRole);

export default router;
