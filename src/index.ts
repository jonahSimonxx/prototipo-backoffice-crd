/**
 * Prototipo Backoffice CRD - Strapi 5
 * RBAC (control de acceso por roles) + datos de demostracion.
 * Prototipo generado con asistencia de IA (agente Vibe, modelo GLM - Mistral AI).
 *
 * En el arranque (bootstrap) este archivo:
 *   1. Crea los roles del sistema: Administrador, Coordinador e Investigador.
 *   2. Aplica la matriz de permisos de cada rol (RBAC declarativo y reproducible).
 *   3. Crea usuarios de prueba con contrasena conocida (para la demostracion).
 *   4. Siembra datos de demostracion con una senal farmacologica intencional
 *      (FarmacoX 200 -> Hepatotoxicidad) para que el analisis estadistico la detecte.
 */

const acciones = (api: string, metodos: string[]) =>
  metodos.map((m) => 'api::' + api + '.' + api + '.' + m);

const CRUD = ['find', 'findOne', 'create', 'update', 'delete'];
const LECTURA = ['find', 'findOne'];

interface DefinicionRol {
  nombre: string;
  descripcion: string;
  acciones: string[];
}

// Matriz de permisos RBAC (declarada en codigo, se aplica en cada arranque)
const ROLES: Record<string, DefinicionRol> = {
  administrador: {
    nombre: 'Administrador',
    descripcion: 'Acceso total: CRUD en todos los modulos, analisis estadistico y gestion de usuarios.',
    acciones: [
      ...acciones('paciente', CRUD),
      ...acciones('medicamento', CRUD),
      ...acciones('administracion-medicamento', CRUD),
      ...acciones('evento-adverso', CRUD),
    ],
  },
  coordinador: {
    nombre: 'Coordinador',
    descripcion: 'Lectura de todos los modulos, registro y edicion de eventos adversos y acceso al analisis estadistico. No puede eliminar registros.',
    acciones: [
      ...acciones('paciente', LECTURA),
      ...acciones('medicamento', LECTURA),
      ...acciones('administracion-medicamento', LECTURA),
      ...acciones('evento-adverso', ['find', 'findOne', 'create', 'update']),
    ],
  },
  investigador: {
    nombre: 'Investigador',
    descripcion: 'Lectura de pacientes, medicamentos y administraciones; registra eventos adversos. Sin acceso al analisis estadistico ni a eliminar registros.',
    acciones: [
      ...acciones('paciente', LECTURA),
      ...acciones('medicamento', LECTURA),
      ...acciones('administracion-medicamento', LECTURA),
      ...acciones('evento-adverso', ['find', 'findOne', 'create']),
    ],
  },
};

// El acceso a /api/analisis/* se controla ademas con la politica
// src/api/analisis-estadistico/policies/es-analista.ts (Coordinador o Administrador)
// y la eliminacion de eventos adversos con policies/solo-admin.ts (Administrador).

const USUARIOS_DEMO = [
  { username: 'admin', email: 'admin@crd.cu', password: 'Admin123!', tipo: 'administrador' },
  { username: 'coordinador', email: 'coordinador@crd.cu', password: 'Coord123!', tipo: 'coordinador' },
  { username: 'investigador', email: 'investigador@crd.cu', password: 'Invest123!', tipo: 'investigador' },
];

const MEDICAMENTOS_DEMO = [
  { nombre: 'Paracetamol 500', principioActivo: 'paracetamol', familia: 'Analgésico', presentacion: 'tabletas' },
  { nombre: 'Ibuprofeno 400', principioActivo: 'ibuprofeno', familia: 'AINE', presentacion: 'tabletas' },
  { nombre: 'Amoxicilina 500', principioActivo: 'amoxicilina', familia: 'Antibiótico', presentacion: 'cápsulas' },
  { nombre: 'Metformina 850', principioActivo: 'metformina', familia: 'Antidiabético', presentacion: 'tabletas' },
  { nombre: 'FármacoX 200', principioActivo: 'experimental-x', familia: 'En investigación', presentacion: 'tabletas' },
];

const PACIENTES_DEMO = [
  { iniciales: 'J.P.M.', edad: 34, sexo: 'M', numeroHistoria: 'H-1001' },
  { iniciales: 'M.L.R.', edad: 41, sexo: 'F', numeroHistoria: 'H-1002' },
  { iniciales: 'A.C.S.', edad: 58, sexo: 'M', numeroHistoria: 'H-1003' },
  { iniciales: 'R.T.G.', edad: 27, sexo: 'F', numeroHistoria: 'H-1004' },
  { iniciales: 'P.E.D.', edad: 63, sexo: 'M', numeroHistoria: 'H-1005' },
  { iniciales: 'L.N.V.', edad: 30, sexo: 'F', numeroHistoria: 'H-1006' },
  { iniciales: 'C.H.B.', edad: 49, sexo: 'M', numeroHistoria: 'H-1007' },
  { iniciales: 'S.A.O.', edad: 22, sexo: 'F', numeroHistoria: 'H-1008' },
  { iniciales: 'D.F.N.', edad: 37, sexo: 'M', numeroHistoria: 'H-1009' },
  { iniciales: 'G.I.C.', edad: 55, sexo: 'F', numeroHistoria: 'H-1010' },
  { iniciales: 'V.R.M.', edad: 45, sexo: 'M', numeroHistoria: 'H-1011' },
  { iniciales: 'T.S.L.', edad: 66, sexo: 'F', numeroHistoria: 'H-1012' },
];

const DESCRIPCIONES = {
  Hepatotoxicidad: 'Elevación de transaminasas compatible con daño hepático; requiere seguimiento.',
  'Reacción cutánea': 'Erupción cutánea / urticaria tras la administración del medicamento.',
  'Trastorno gastrointestinal': 'Náuseas, vómitos o dolor epigástrico tras la administración.',
  Cefalea: 'Cefalea de intensidad leve a moderada tras la administración.',
  'Reacción anafiláctica': 'Reacción de hipersensibilidad grave; se requiere atención urgente.',
};

// [medicamento, tipo de evento, cantidad, gravedades por unidad]
// FarmacoX 200 concentra los casos de Hepatotoxicidad: es la senal que el
// analisis debe detectar con PRR alto y chi-cuadrado alto (criterios de Evans).
const EVENTOS_DEMO: Array<[string, string, number, string[]]> = [
  ['FármacoX 200', 'Hepatotoxicidad', 6, ['grave', 'grave', 'grave', 'grave', 'grave', 'moderada']],
  ['FármacoX 200', 'Reacción cutánea', 2, ['leve', 'leve']],
  ['FármacoX 200', 'Cefalea', 2, ['leve', 'leve']],
  ['Paracetamol 500', 'Hepatotoxicidad', 2, ['moderada', 'moderada']],
  ['Paracetamol 500', 'Trastorno gastrointestinal', 8, Array(8).fill('leve')],
  ['Paracetamol 500', 'Cefalea', 7, Array(7).fill('leve')],
  ['Paracetamol 500', 'Reacción cutánea', 4, Array(4).fill('leve')],
  ['Paracetamol 500', 'Reacción anafiláctica', 1, ['grave']],
  ['Ibuprofeno 400', 'Hepatotoxicidad', 1, ['moderada']],
  ['Ibuprofeno 400', 'Trastorno gastrointestinal', 7, Array(7).fill('leve')],
  ['Ibuprofeno 400', 'Reacción cutánea', 5, Array(5).fill('leve')],
  ['Ibuprofeno 400', 'Cefalea', 4, Array(4).fill('leve')],
  ['Ibuprofeno 400', 'Reacción anafiláctica', 1, ['grave']],
  ['Amoxicilina 500', 'Reacción cutánea', 5, Array(5).fill('leve')],
  ['Amoxicilina 500', 'Trastorno gastrointestinal', 4, Array(4).fill('leve')],
  ['Amoxicilina 500', 'Cefalea', 3, Array(3).fill('leve')],
  ['Amoxicilina 500', 'Reacción anafiláctica', 3, ['moderada', 'moderada', 'moderada']],
  ['Metformina 850', 'Trastorno gastrointestinal', 6, Array(6).fill('leve')],
  ['Metformina 850', 'Cefalea', 3, Array(3).fill('leve')],
  ['Metformina 850', 'Reacción cutánea', 1, ['leve']],
];

export default {
  register() {
    // Este prototipo no necesita hooks de registro.
  },

  async bootstrap({ strapi }: { strapi: any }) {
    await crearRolesYPermisos(strapi);
    await crearUsuariosDemo(strapi);
    await sembrarDatosDemo(strapi);
  },
};

async function crearRolesYPermisos(strapi: any) {
  const rolesDB = strapi.db.query('plugin::users-permissions.role');
  const permisosDB = strapi.db.query('plugin::users-permissions.permission');

  for (const [tipo, def] of Object.entries(ROLES)) {
    let rol = await rolesDB.findOne({ where: { type: tipo } });
    if (!rol) {
      rol = await rolesDB.create({
        data: { name: def.nombre, description: def.descripcion, type: tipo },
      });
      strapi.log.info('[RBAC] Rol creado: ' + def.nombre);
    }

    // Se reescribe la matriz de permisos del rol en cada arranque:
    // configuracion declarativa, reproducible y auditable.
    await permisosDB.deleteMany({ where: { role: { id: rol.id } } });
    for (const action of def.acciones) {
      await permisosDB.create({ data: { action, role: rol.id } });
    }
  }
  strapi.log.info('[RBAC] Matriz de permisos aplicada: Administrador / Coordinador / Investigador.');
}

async function crearUsuariosDemo(strapi: any) {
  const usuariosDB = strapi.db.query('plugin::users-permissions.user');
  const rolesDB = strapi.db.query('plugin::users-permissions.role');

  for (const u of USUARIOS_DEMO) {
    const existe = await usuariosDB.findOne({ where: { email: u.email } });
    if (existe) continue;
    const rol = await rolesDB.findOne({ where: { type: u.tipo } });
    if (!rol) continue;
    await strapi.plugin('users-permissions').service('user').add({
      username: u.username,
      email: u.email,
      password: u.password,
      role: rol.id,
      confirmed: true,
      blocked: false,
    });
    strapi.log.info('[RBAC] Usuario de prueba creado: ' + u.email + ' (' + u.tipo + ')');
  }
}

async function sembrarDatosDemo(strapi: any) {
  const existentes = await strapi
    .documents('api::evento-adverso.evento-adverso')
    .findMany({ limit: 1 });
  if (existentes.length > 0) return;

  // Medicamentos
  const medIds: Record<string, string> = {};
  for (const m of MEDICAMENTOS_DEMO) {
    const encontrado = await strapi
      .documents('api::medicamento.medicamento')
      .findFirst({ filters: { nombre: m.nombre } });
    if (encontrado) {
      medIds[m.nombre] = encontrado.documentId;
    } else {
      const creado = await strapi.documents('api::medicamento.medicamento').create({ data: m });
      medIds[m.nombre] = creado.documentId;
    }
  }

  // Pacientes
  const pacIds: string[] = [];
  for (const p of PACIENTES_DEMO) {
    const creado = await strapi.documents('api::paciente.paciente').create({ data: p });
    pacIds.push(creado.documentId);
  }

  // Administraciones de ejemplo (realismo del dominio)
  for (let k = 0; k < 15; k++) {
    await strapi.documents('api::administracion-medicamento.administracion-medicamento').create({
      data: {
        fecha: new Date(Date.now() - k * 11 * 86400000).toISOString(),
        dosis: '1 unidad',
        via: 'oral',
        paciente: pacIds[k % pacIds.length],
        medicamento: medIds[MEDICAMENTOS_DEMO[k % MEDICAMENTOS_DEMO.length].nombre],
      },
    });
  }

  // Eventos adversos (75 en total, con la senal intencional de FarmacoX 200)
  let i = 0;
  for (const [med, tipo, cantidad, gravedades] of EVENTOS_DEMO) {
    for (let k = 0; k < cantidad; k++) {
      const fecha = new Date(Date.now() - i * 9 * 86400000).toISOString();
      await strapi.documents('api::evento-adverso.evento-adverso').create({
        data: {
          descripcion: (DESCRIPCIONES as Record<string, string>)[tipo] ?? 'Evento adverso registrado.',
          tipo,
          gravedad: gravedades[k] ?? 'leve',
          fecha,
          medicamento: medIds[med],
          paciente: pacIds[i % pacIds.length],
        },
      });
      i++;
    }
  }
  strapi.log.info('[DEMO] Datos sembrados: ' + i + ' eventos adversos. Senal esperada en FarmacoX 200 / Hepatotoxicidad.');
}
