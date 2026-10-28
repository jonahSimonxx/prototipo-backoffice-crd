import { factories } from '@strapi/strapi';

// Rutas CRUD estandar. Los permisos por rol se gestionan en el bootstrap RBAC (src/index.ts).
export default factories.createCoreRouter('api::medicamento.medicamento');
