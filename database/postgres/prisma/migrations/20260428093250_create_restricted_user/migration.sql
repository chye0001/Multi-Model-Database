-- RESTRICTED USER (cannot see users table — hides sensitive data)
-- alos read only
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_roles WHERE rolname = 'restricted_user'
   ) THEN
      CREATE ROLE restricted_user WITH LOGIN PASSWORD 'strongpassword';
   END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO restricted_user;
GRANT USAGE ON SCHEMA public TO restricted_user;

-- Grant SELECT on all tables EXCEPT users
GRANT SELECT ON 
    closets,
    closet_items,
    outfits,
    outfit_items,
    items,
    item_brands,
    brands,
    categories,
    images,
    reviews,
    roles,
    countries,
    shared_closets
TO restricted_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO restricted_user;

ALTER ROLE restricted_user NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;