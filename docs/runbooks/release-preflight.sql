-- Executar no banco alvo; não altera dados. Conta separadamente para evitar multiplicação de joins.
BEGIN TRANSACTION READ ONLY;
WITH obsolete(code) AS (VALUES ('85171200'), ('64039900'), ('85235100'), ('84715000'), ('99999999'))
SELECT code AS obsolete_ncm,
 (SELECT count(*) FROM products p WHERE p."ncmCode" = code) AS products,
 (SELECT count(*) FROM tax_rules r WHERE r."ncmCode" = code) AS rules_total,
 (SELECT count(*) FROM tax_rules r WHERE r."ncmCode" = code AND r.status = 'ACTIVE') AS rules_active
FROM obsolete ORDER BY code;
-- demo2 é marcador textual, não identidade de tenant conhecida; revisar resultados.
WITH candidates AS (
 SELECT id FROM companies WHERE name ILIKE '%demo2%'
 UNION
 SELECT "companyId" FROM users WHERE name ILIKE '%demo2%' OR email ILIKE '%demo2%'
)
SELECT c.id, c.name,
 (SELECT count(*) FROM users u WHERE u."companyId" = c.id) AS users,
 (SELECT count(*) FROM products p WHERE p."companyId" = c.id) AS products,
 (SELECT count(*) FROM clients cl WHERE cl."companyId" = c.id) AS clients,
 (SELECT count(*) FROM sales s WHERE s."companyId" = c.id) AS sales
FROM companies c JOIN candidates d ON d.id = c.id;
SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name;
COMMIT;
