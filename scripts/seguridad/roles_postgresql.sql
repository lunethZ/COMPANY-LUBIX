-- =====================================================================
-- LUBIX - Roles de PostgreSQL con minimo privilegio (tarea P4-S5)
--
-- Uso (como superusuario, dentro de la base de datos de LUBIX):
--   docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d lubix \
--     -v owner_password="$OWNER_PW" \
--     -v app_password="$APP_PW" \
--     -v backup_password="$BACKUP_PW" \
--     < scripts/seguridad/roles_postgresql.sql
--
-- El script es idempotente. Ejecutalo antes de la primera migracion (para
-- que los privilegios por defecto apliquen a las tablas nuevas) y vuelve a
-- ejecutarlo despues del primer arranque del backend.
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------
-- 1. Roles de login
--    lubix_owner  -> migraciones Alembic (DDL)
--    lubix_app    -> API en ejecucion (solo DML)
--    lubix_backup -> pg_dump / respaldos (solo lectura)
-- ---------------------------------------------------------------------
SELECT format(
  'CREATE ROLE lubix_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 5 PASSWORD %L',
  :'owner_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lubix_owner')
\gexec

SELECT format(
  'CREATE ROLE lubix_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 20 PASSWORD %L',
  :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lubix_app')
\gexec

SELECT format(
  'CREATE ROLE lubix_backup LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 3 PASSWORD %L',
  :'backup_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lubix_backup')
\gexec

-- Si los roles ya existian, se fuerzan los atributos y se rota la clave.
ALTER ROLE lubix_owner  NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN CONNECTION LIMIT 5;
ALTER ROLE lubix_app    NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN CONNECTION LIMIT 20;
ALTER ROLE lubix_backup NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN CONNECTION LIMIT 3;

SELECT format('ALTER ROLE lubix_owner WITH PASSWORD %L', :'owner_password')
\gexec
SELECT format('ALTER ROLE lubix_app WITH PASSWORD %L', :'app_password')
\gexec
SELECT format('ALTER ROLE lubix_backup WITH PASSWORD %L', :'backup_password')
\gexec

-- Limites defensivos para la API.
ALTER ROLE lubix_app SET statement_timeout = '30s';
ALTER ROLE lubix_app SET idle_in_transaction_session_timeout = '60s';

-- ---------------------------------------------------------------------
-- 2. Propiedad de la base de datos y del esquema
-- ---------------------------------------------------------------------
SELECT format('ALTER DATABASE %I OWNER TO lubix_owner', current_database())
\gexec

ALTER SCHEMA public OWNER TO lubix_owner;

-- ---------------------------------------------------------------------
-- 3. Reasignar objetos creados antes por un superusuario (postgres u otro)
--    para que lubix_owner pueda seguir migrando y dar privilegios.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS obj, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles ro ON ro.oid = c.relowner
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'S', 'v', 'm', 'f')
      AND ro.rolsuper
  LOOP
    EXECUTE format(
      'ALTER %s %s OWNER TO lubix_owner',
      CASE r.relkind
        WHEN 'S' THEN 'SEQUENCE'
        WHEN 'v' THEN 'VIEW'
        WHEN 'm' THEN 'MATERIALIZED VIEW'
        WHEN 'f' THEN 'FOREIGN TABLE'
        ELSE 'TABLE'
      END,
      r.obj);
  END LOOP;

  FOR r IN
    SELECT t.oid::regtype AS obj
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_roles ro ON ro.oid = t.typowner
    WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'd')
      AND t.typname !~ '^_'
      AND ro.rolsuper
  LOOP
    EXECUTE format('ALTER TYPE %s OWNER TO lubix_owner', r.obj);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. Privilegios
-- ---------------------------------------------------------------------
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database())
\gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO lubix_app, lubix_backup', current_database())
\gexec

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO lubix_app, lubix_backup;
GRANT CREATE ON SCHEMA public TO lubix_owner;

-- API: solo lectura y escritura de datos, sin DDL.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lubix_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lubix_app;
REVOKE CREATE ON SCHEMA public FROM lubix_app;

-- Respaldo: solo lectura.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO lubix_backup;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lubix_backup;

-- La app no debe tocar el control de versiones de Alembic.
DO $$
BEGIN
  IF to_regclass('public.alembic_version') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.alembic_version FROM lubix_app';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. Privilegios por defecto para tablas y secuencias futuras
--    (las que creen las proximas migraciones de lubix_owner).
-- ---------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE lubix_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lubix_app;
ALTER DEFAULT PRIVILEGES FOR ROLE lubix_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO lubix_app;
ALTER DEFAULT PRIVILEGES FOR ROLE lubix_owner IN SCHEMA public
  GRANT SELECT ON TABLES TO lubix_backup;
ALTER DEFAULT PRIVILEGES FOR ROLE lubix_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO lubix_backup;

-- ---------------------------------------------------------------------
-- 6. Resumen para la evidencia
-- ---------------------------------------------------------------------
\echo '--- Roles ---'
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin, rolconnlimit
FROM pg_roles
WHERE rolname IN ('lubix_owner', 'lubix_app', 'lubix_backup')
ORDER BY rolname;

\echo '--- Dueno de la base ---'
SELECT datname, pg_get_userbyid(datdba) AS owner
FROM pg_database
WHERE datname = current_database();

\echo '--- Tablas y dueno ---'
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo '--- Privilegios de lubix_app ---'
SELECT table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.role_table_grants
WHERE grantee = 'lubix_app' AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
