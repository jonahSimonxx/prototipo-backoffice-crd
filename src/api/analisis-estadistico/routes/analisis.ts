/**
 * Rutas del modulo de analisis estadistico (API personalizada).
 * Protegidas por la politica es-analista (RBAC): Coordinador o Administrador.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/analisis/resumen',
      handler: 'analisis.resumen',
      config: {
        policies: ['api::analisis-estadistico.es-analista'],
      },
    },
    {
      method: 'GET',
      path: '/analisis/senales',
      handler: 'analisis.senales',
      config: {
        policies: ['api::analisis-estadistico.es-analista'],
      },
    },
    {
      method: 'GET',
      path: '/analisis/tendencia',
      handler: 'analisis.tendencia',
      config: {
        policies: ['api::analisis-estadistico.es-analista'],
      },
    },
  ],
};
