-- Prepared for review only. Resolve duplicate identities manually before applying.
-- No account is removed, reassigned or merged by this migration.
-- Read-only preflight (returns a count, not personal data):
-- SELECT count(*) AS duplicate_email_groups FROM (
--   SELECT 1 FROM "users" GROUP BY lower("email") HAVING count(*) > 1
-- ) AS duplicates;
BEGIN;

LOCK TABLE "users" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "users" GROUP BY lower("email") HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate user emails: resolve identities before applying unique_user_email';
  END IF;
END $$;

UPDATE "users" SET "email" = lower("email") WHERE "email" <> lower("email");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email"));
DROP INDEX "users_companyId_email_key";

COMMIT;
