/**
 * Controlador del modulo de analisis estadistico.
 * Las rutas estan protegidas por la politica "es-analista":
 * solo los roles Coordinador y Administrador pueden consultar el analisis.
 */
export default {
  async resumen(ctx: any) {
    ctx.body = await strapi.service('api::analisis-estadistico.estadistica').resumen();
  },

  async senales(ctx: any) {
    ctx.body = await strapi.service('api::analisis-estadistico.estadistica').senales(ctx.query);
  },

  async tendencia(ctx: any) {
    ctx.body = await strapi.service('api::analisis-estadistico.estadistica').tendencia(ctx.query);
  },
};
