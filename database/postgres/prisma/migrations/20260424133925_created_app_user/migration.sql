-- Creates an application user with DML privileges only (idempotent)
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_roles WHERE rolname = 'app_user'
   ) THEN
      CREATE ROLE app_user WITH LOGIN PASSWORD 'strongpassword';
   END IF;
END
$$;

-- Grant connect on database
GRANT CONNECT ON DATABASE postgres TO app_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant DML only on all existing tables (no DDL)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Grant usage on sequences (required for autoincrement inserts)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Apply same grants to any future tables created by migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Explicitly deny DDL powers
ALTER ROLE app_user NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;