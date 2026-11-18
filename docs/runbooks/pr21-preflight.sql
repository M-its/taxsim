-- PR #21: somente leitura; executar futuramente no banco alvo com ON_ERROR_STOP.
-- Nao lista emails, IDs de usuarios, hashes de senha, tokens ou logs de migrations.
-- Saida bem-sucedida do psql nao significa aprovacao: aplicar os gates do runbook.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '3s';

SELECT current_setting('server_version_num') AS server_version_num;

SELECT count(*) AS users_total,
       count(*) FILTER (WHERE email IS NULL OR btrim(email) = '') AS missing_emails,
       count(*) FILTER (WHERE email <> lower(email)) AS emails_to_normalize
FROM public.users;

WITH email_groups AS (
  SELECT lower(email) AS normalized_email,
         count(*) AS users_count,
         count(DISTINCT "companyId") AS companies_count
  FROM public.users
  GROUP BY lower(email)
)
SELECT count(*) FILTER (WHERE users_count > 1) AS duplicate_email_groups,
       COALESCE(sum(users_count) FILTER (WHERE users_count > 1), 0) AS affected_users,
       count(*) FILTER (WHERE users_count > 1 AND companies_count > 1)
         AS cross_company_duplicate_groups
FROM email_groups;

SELECT index_class.relname AS index_name,
       index_info.indisunique AS is_unique,
       index_info.indisvalid AS is_valid,
       index_info.indisready AS is_ready,
       pg_get_indexdef(index_info.indexrelid) AS definition
FROM pg_index AS index_info
JOIN pg_class AS index_class ON index_class.oid = index_info.indexrelid
WHERE index_info.indrelid = 'public.users'::regclass
  AND index_class.relname IN ('users_companyId_email_key', 'users_email_key')
ORDER BY index_class.relname;

SELECT conname AS constraint_name,
       convalidated AS is_valid,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_email_lowercase_check';

SELECT count(*) FILTER (
         WHERE finished_at IS NULL AND rolled_back_at IS NULL
       ) AS unresolved_migrations,
       count(*) FILTER (
         WHERE migration_name = '20261116120000_unique_user_email'
           AND finished_at IS NOT NULL AND rolled_back_at IS NULL
       ) AS target_successful_applications
FROM public._prisma_migrations;

SELECT migration_name, checksum, finished_at, rolled_back_at
FROM public._prisma_migrations
ORDER BY started_at, migration_name;

-- Apenas sinais de contencao: nao demonstra ausencia de escritores externos.
SELECT count(DISTINCT activity.pid) AS other_transactions_locking_users,
       max(clock_timestamp() - activity.xact_start) AS oldest_transaction_age
FROM pg_locks AS locks
JOIN pg_stat_activity AS activity ON activity.pid = locks.pid
WHERE locks.relation = 'public.users'::regclass
  AND locks.database = (SELECT oid FROM pg_database WHERE datname = current_database())
  AND activity.pid <> pg_backend_pid()
  AND activity.xact_start IS NOT NULL;

COMMIT;
