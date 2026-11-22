-- =====================================================================
-- LUBIX - Roles de PostgreSQL con minimo privilegio en Neon (P4-S5)
--
-- Variante para el despliegue Render + Neon. NO cambia el dueno de la
-- base ni reasigna propiedad: en Neon no hay superusuario y el rol del
-- proyecto ya es el dueno.
--
-- COMO USARLO
--   1. Genera dos contrasenas (24 bytes en hexadecimal, minimo 60 bits
--      de entropia que exige Neon):
--        openssl rand -hex 24   # APP
--        openssl rand -hex 24   # BACKUP
--   2. Reemplaza __APP_PASSWORD__ y __BACKUP_PASSWORD__ en este archivo.
--   3. Pegalo en el editor SQL de Neon (o ejecutalo con psql) conectado
--      con el rol dueno del proyecto, el mismo de DATABASE_URL_UNPOOLED.
--
-- Es idempotente. Ejecutalo antes de apuntar URL_DATABASE a lubix_app y
-- vuelve a ejecutarlo despues del primer despliegue para revocar
-- alembic_version si la tabla ya existia.
-- =====================================================================

-- 0. Seguridad: no continuar si los placeholders no se reemplazaron.
--    Los valores generados son hex (sin "__" y 48 caracteres).
DO $$
BEGIN
  IF position('__' IN '__APP_PASSWORD__') > 0
     OR length('__APP_PASSWORD__') < 20 THEN
    RAISE EXCEPTION 'Reemplaza __APP_PASSWORD__ antes de ejecutar el script';
  END IF;
  IF position('__' IN '__BACKUP_PASSWORD__') > 0
     OR length('__BACKUP_PASSWORD__') < 20 THEN
    RAISE EXCEPTION 'Reemplaza __BACKUP_PASSWORD__ antes de ejecutar el script';
  END IF;
END $$;

-- 1. Contexto: el rol actual debe poder crear roles (CREATEROLE).
--    En Neon lo aporta neon_superuser (rol del proyecto).
SELECT current_user AS rol,
       current_database() AS base,
       rolsuper,
       rolcreaterole
FROM pg_roles
WHERE rolname = current_user;

-- 2. Roles de login. Se crean con SQL para que NO hereden neon_superuser.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lubix_app') THEN
    EXECUTE format(
      'CREATE ROLE lubix_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 20 PASSWORD %L',
      '__APP_PASSWORD__');
  ELSE
    EXECUTE format(
      'ALTER ROLE lubix_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 20 PASSWORD %L',
      '__APP_PASSWORD__');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lubix_backup') THEN
    EXECUTE format(
      'CREATE ROLE lubix_backup LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 3 PASSWORD %L',
      '__BACKUP_PASSWORD__');
  ELSE
    EXECUTE format(
      'ALTER ROLE lubix_backup WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 3 PASSWORD %L',
      '__BACKUP_PASSWORD__');
  END IF;
END $$;

ALTER ROLE lubix_app SET statement_timeout = '30s';
ALTER ROLE lubix_app SET idle_in_transaction_session_timeout = '60s';

-- Si algun rol se creo por error desde la consola de Neon, tendria
-- neon_superuser (privilegios de administrador). Se intenta retirar; si el
-- rol actual no puede, se avisa para recrear el rol con SQL.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT m.member::regrole AS rol
    FROM pg_auth_members m
    JOIN pg_roles g ON g.oid = m.roleid
    WHERE g.rolname = 'neon_superuser'
      AND m.member::regrole::text IN ('lubix_app', 'lubix_backup')
  LOOP
    BEGIN
      EXECUTE format('REVOKE neon_superuser FROM %s', r.rol);
      RAISE NOTICE 'Se retiro neon_superuser de %', r.rol;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE WARNING 'No se pudo retirar neon_superuser de %. Elimina el rol y vuelve a crearlo con este script.', r.rol;
    END;
  END LOOP;
END $$;

-- 3. Privilegios sobre la base y el esquema.
--    No se revoca CONNECT a PUBLIC: Neon gestiona conexiones y roles
--    internos (pooler). La restriccion real se hace por privilegios.
DO $$
BEGIN
  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO lubix_app, lubix_backup',
    current_database());
END $$;

GRANT USAGE ON SCHEMA public TO lubix_app, lubix_backup;
REVOKE CREATE ON SCHEMA public FROM lubix_app;

-- API: solo lectura y escritura de datos, sin DDL.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lubix_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lubix_app;

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

-- 4. Privilegios por defecto para tablas y secuencias futuras.
--    Sin FOR ROLE: aplica a las tablas que cree el rol actual, que debe
--    ser el mismo de DATABASE_URL_UNPOOLED (migraciones en Render).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lubix_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO lubix_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO lubix_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO lubix_backup;

-- 5. Resumen para la evidencia.
SELECT 'resultado' AS seccion, rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin, rolconnlimit
FROM pg_roles
WHERE rolname IN ('lubix_app', 'lubix_backup')
ORDER BY rolname;

SELECT 'membresias_neon_superuser_vacio' AS seccion, m.member::regrole AS rol
FROM pg_auth_members m
JOIN pg_roles g ON g.oid = m.roleid
WHERE g.rolname = 'neon_superuser'
  AND m.member::regrole::text IN ('lubix_app', 'lubix_backup');

SELECT 'privilegios_app' AS seccion,
       table_name,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.role_table_grants
WHERE grantee = 'lubix_app' AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
