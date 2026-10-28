import { factories } from '@strapi/strapi';

// Rutas CRUD estandar + restriccion RBAC adicional a nivel de ruta:
// eliminar un evento adverso solo lo permite el rol Administrador.
export default factories.createCoreRouter('api::evento-adverso.evento-adverso', {
  config: {
    delete: {
      policies: ['api::evento-adverso.solo-admin'],
    },
  },
});
