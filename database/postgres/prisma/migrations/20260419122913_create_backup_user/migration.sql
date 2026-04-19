-- This is an empty migration.
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_roles WHERE rolname = 'backup_user'
   ) THEN
      CREATE ROLE backup_user WITH LOGIN REPLICATION PASSWORD 'strongpassword';
   END IF;
END
$$;
GRANT CONNECT ON DATABASE postgres TO backup_user;