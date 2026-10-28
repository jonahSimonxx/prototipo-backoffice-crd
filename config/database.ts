// Prototipo: SQLite sin configuracion extra.
// Para pasar a PostgreSQL (como el sistema CRD real), cambiar client a 'pg'
// y usar connection: { host, port, database, user, password } con la dependencia 'pg'.
export default ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: env('DATABASE_FILENAME', '.tmp/data.db'),
    },
    useNullAsDefault: true,
    pool: {
      min: 0,
      max: 1,
    },
    acquireConnectionTimeout: 600000,
  },
});
