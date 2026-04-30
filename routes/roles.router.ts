import { Router } from 'express';
import { rolesRepositoryFactory } from '../repositories/factories/RolesRepositoryFactory.js';
import { RolesService } from '../services/RolesService.js';
import { RolesController } from '../controllers/RolesController.js';
import { hasRole } from '../middleware/rbac.middleware.ts';

const router = Router();

const rolesRepository = rolesRepositoryFactory();
const rolesService = new RolesService(rolesRepository);
const rolesController = new RolesController(rolesService);

router.get('/', hasRole(["admin"]), rolesController.getAllRoles);
router.post('/', hasRole(["admin"]), rolesController.createRole);
router.delete('/:name', hasRole(["admin"]), rolesController.deleteRole);

export default router;
