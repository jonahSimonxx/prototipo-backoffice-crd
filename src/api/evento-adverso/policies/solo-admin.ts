/**
 * Politica RBAC: la eliminacion de registros solo la puede realizar
 * un usuario con rol Administrador. Cualquier otro rol autenticado
 * recibe 403 Forbidden.
 */
import { errors } from '@strapi/utils';

export default async (ctx: any, _config: any, { strapi }: any) => {
  const usuario = ctx.state?.user;
  if (!usuario) {
    throw new errors.UnauthorizedError('Debes iniciar sesión.');
  }
  if (usuario.role?.type === 'administrador') {
    return true;
  }
  throw new errors.ForbiddenError('Solo el rol Administrador puede eliminar registros.');
};
