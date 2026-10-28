/**
 * Servicio de analisis estadistico - mineria de datos sobre los eventos adversos.
 * Tecnicas de deteccion de senales farmacologicas (analisis de proporcionalidad,
 * formulacion estandar en farmacovigilancia - UMC/OMS, EMA):
 *   - PRR (Proportional Reporting Ratio) con IC del 95%
 *   - ROR (Reporting Odds Ratio) con IC del 95%
 *   - Chi-cuadrado con correccion de Yates
 *   - Criterios de Evans: PRR >= 2, chi2 >= 4, casos >= 3
 *
 * Tabla 2x2 por medicamento y evento de interes:
 *   a: eventos del tipo de interes con el medicamento analizado
 *   b: otros eventos con el medicamento analizado
 *   c: eventos del tipo de interes con el resto de los medicamentos
 *   d: otros eventos con el resto de los medicamentos
 */

const Z_95 = 1.96;

function icPrr(a: number, b: number, c: number, d: number) {
  const se = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
  const prr = (a / (a + b)) / (c / (c + d));
  return {
    prr,
    inferior: Math.exp(Math.log(prr) - Z_95 * se),
    superior: Math.exp(Math.log(prr) + Z_95 * se),
  };
}

function icRor(a: number, b: number, c: number, d: number) {
  const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const ror = (a * d) / (b * c);
  return {
    ror,
    inferior: Math.exp(Math.log(ror) - Z_95 * se),
    superior: Math.exp(Math.log(ror) + Z_95 * se),
  };
}

function chiCuadradoYates(a: number, b: number, c: number, d: number): number {
  const n = a + b + c + d;
  const numerador = Math.pow(Math.abs(a * d - b * c) - n / 2, 2) * n;
  const denominador = (a + b) * (c + d) * (a + c) * (b + d);
  return denominador === 0 ? 0 : numerador / denominador;
}

// Criterios de Evans: senal cuando PRR >= 2, chi2 >= 4 y al menos 3 casos.
function criteriosEvans(prr: number, chi2: number, casos: number): boolean {
  return prr >= 2 && chi2 >= 4 && casos >= 3;
}

function redondear(x: number | null): number | null {
  return x === null ? null : Math.round(x * 100) / 100;
}

export default ({ strapi }: { strapi: any }) => ({
  async obtenerEventos() {
    return strapi.documents('api::evento-adverso.evento-adverso').findMany({
      populate: { medicamento: true },
      limit: 2000,
    });
  },

  /** Estadistica descriptiva del repositorio de eventos adversos. */
  async resumen() {
    const eventos = await this.obtenerEventos();

    const porGravedad: Record<string, number> = { leve: 0, moderada: 0, grave: 0 };
    const porTipo: Record<string, number> = {};
    const porMedicamento: Record<string, number> = {};

    for (const e of eventos) {
      porGravedad[e.gravedad] = (porGravedad[e.gravedad] ?? 0) + 1;
      porTipo[e.tipo] = (porTipo[e.tipo] ?? 0) + 1;
      const med = e.medicamento?.nombre ?? 'Sin medicamento';
      porMedicamento[med] = (porMedicamento[med] ?? 0) + 1;
    }

    const total = eventos.length;
    const topMedicamentos = Object.entries(porMedicamento)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return {
      totalEventos: total,
      eventosGraves: porGravedad.grave,
      porcentajeGraves: total ? Math.round((100 * porGravedad.grave) / total * 10) / 10 : 0,
      porGravedad,
      porTipo,
      topMedicamentos,
      generadoEn: new Date().toISOString(),
    };
  },

  /**
   * Deteccion de senales: tabla 2x2 por medicamento frente a un evento de interes.
   * GET /api/analisis/senales?evento=Hepatotoxicidad
   * Si no se indica evento, se usa el tipo de evento mas frecuente.
   */
  async senales(query: any = {}) {
    const eventos = await this.obtenerEventos();

    const conteoTipos: Record<string, number> = {};
    for (const e of eventos) conteoTipos[e.tipo] = (conteoTipos[e.tipo] ?? 0) + 1;

    const tipoObjetivo =
      (query.evento && String(query.evento)) ||
      Object.entries(conteoTipos).sort((x, y) => y[1] - x[1])[0][0];

    // Conteos por medicamento
    const conteos: Record<string, { total: number; objetivo: number }> = {};
    let objetivoGlobal = 0;
    for (const e of eventos) {
      const med = e.medicamento?.nombre ?? 'Sin medicamento';
      conteos[med] = conteos[med] ?? { total: 0, objetivo: 0 };
      conteos[med].total += 1;
      if (e.tipo === tipoObjetivo) {
        conteos[med].objetivo += 1;
        objetivoGlobal += 1;
      }
    }

    const totalGlobal = eventos.length;
    const resultados: any[] = [];

    for (const [medicamento, c] of Object.entries(conteos)) {
      const a = c.objetivo;
      const b = c.total - a;
      const cc = objetivoGlobal - a;
      const d = totalGlobal - objetivoGlobal - b;

      if (a + b === 0 || cc + d === 0) continue;

      const fila: any = { medicamento, evento: tipoObjetivo, a, b, c: cc, d };

      if (cc === 0) {
        // Sin casos del evento en el resto de medicamentos: proporcion no
        // comparable, se marca para revision manual.
        Object.assign(fila, {
          prr: null, prrInferior: null, prrSuperior: null,
          ror: null, rorInferior: null, rorSuperior: null,
          chi2: null, esSenal: false, revisionManual: true,
        });
      } else {
        const prr = icPrr(a, b, cc, d);
        const ror = icRor(a, b, cc, d);
        const chi2 = chiCuadradoYates(a, b, cc, d);
        Object.assign(fila, {
          prr: redondear(prr.prr),
          prrInferior: redondear(prr.inferior),
          prrSuperior: redondear(prr.superior),
          ror: redondear(ror.ror),
          rorInferior: redondear(ror.inferior),
          rorSuperior: redondear(ror.superior),
          chi2: redondear(chi2),
          esSenal: criteriosEvans(prr.prr, chi2, a),
          revisionManual: false,
        });
      }
      resultados.push(fila);
    }

    resultados.sort((x, y) => {
      if (x.esSenal !== y.esSenal) return x.esSenal ? -1 : 1;
      return (y.prr ?? -1) - (x.prr ?? -1);
    });

    return {
      evento: tipoObjetivo,
      criterioEvans: 'PRR >= 2, chi-cuadrado >= 4, casos >= 3',
      totalEventos: totalGlobal,
      resultados,
      generadoEn: new Date().toISOString(),
    };
  },

  /** Serie temporal mensual de eventos por gravedad. */
  async tendencia(query: any = {}) {
    const eventos = await this.obtenerEventos();

    const serie: Record<string, any> = {};
    for (const e of eventos) {
      const mes = String(e.fecha ?? '').slice(0, 7); // YYYY-MM
      serie[mes] = serie[mes] ?? { mes, leve: 0, moderada: 0, grave: 0, total: 0 };
      serie[mes][e.gravedad] += 1;
      serie[mes].total += 1;
    }

    return Object.values(serie).sort((x: any, y: any) => x.mes.localeCompare(y.mes));
  },
});
