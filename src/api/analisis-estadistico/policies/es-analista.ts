/**
 * Politica RBAC del modulo de analisis estadistico:
 * solo los roles Coordinador y Administrador pueden acceder.
 * El rol Investigador recibe 403 Forbidden.
 */
import { errors } from '@strapi/utils';

export default async (ctx: any, _config: any, { strapi }: any) => {
  const usuario = ctx.state?.user;
  if (!usuario) {
    throw new errors.UnauthorizedError('Debes iniciar sesión para consultar el análisis.');
  }
  const tipo = usuario.role?.type;
  if (tipo === 'coordinador' || tipo === 'administrador') {
    return true;
  }
  throw new errors.ForbiddenError(
    'El rol "' + (usuario.role?.name ?? tipo) + '" no tiene permiso para el análisis estadístico.'
  );
};
