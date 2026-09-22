-- Correct obsolete NCM rules without rewriting immutable fiscal snapshots.
--
-- Safe automatic mappings approved after auditing the 10/07/2026 NCM table:
--   85171200 -> 85171300 (smartphone)
--   64039900 -> 64039990 (other leather footwear)
--   85235100 -> 85235190 (other solid-state storage devices / pendrive)
--   84715000 -> 84715010 (small desktop; seed premise documents the scope)
--
-- 99999999 is a fictitious service code. Its rules are archived and products
-- that still use it are intentionally left unchanged for manual correction.
--
-- sale_items is deliberately never updated: ncmCode is an immutable fiscal snapshot.

-- Refuse to collapse two historical rows into one. This protects auditability
-- if an environment was manually partially migrated before this migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "tax_rules" active_rule
    JOIN "tax_rules" archived_rule
      ON archived_rule."ncmCode" = active_rule."ncmCode"
     AND archived_rule."taxRegime" = active_rule."taxRegime"
     AND archived_rule."status" = 'ARCHIVED'
    WHERE active_rule."status" = 'ACTIVE'
      AND active_rule."ncmCode" IN (
        '85171200',
        '64039900',
        '85235100',
        '84715000',
        '99999999'
      )
  ) THEN
    RAISE EXCEPTION
      'Cannot archive obsolete NCM rules: an ACTIVE and an ARCHIVED rule already coexist for the same NCM/regime';
  END IF;
END $$;

-- Copy each active obsolete rule to its approved current code. ON CONFLICT
-- makes the data migration safe when the destination rule already exists.
INSERT INTO "tax_rules" (
  "id", "ncmCode", "taxRegime", "status",
  "pisRate", "cofinsRate", "icmsRate", "issRate",
  "validFrom", "validUntil", "createdAt", "updatedAt",
  "cClassTrib", "cst"
)
SELECT
  gen_random_uuid(),
  mapping.new_code,
  source_rule."taxRegime",
  'ACTIVE'::"TaxRuleStatus",
  source_rule."pisRate",
  source_rule."cofinsRate",
  source_rule."icmsRate",
  source_rule."issRate",
  source_rule."validFrom",
  source_rule."validUntil",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  source_rule."cClassTrib",
  source_rule."cst"
FROM "tax_rules" source_rule
JOIN (
  VALUES
    ('85171200', '85171300'),
    ('64039900', '64039990'),
    ('85235100', '85235190'),
    ('84715000', '84715010')
) AS mapping(old_code, new_code)
  ON source_rule."ncmCode" = mapping.old_code
WHERE source_rule."status" = 'ACTIVE'
ON CONFLICT ("ncmCode", "taxRegime", "status")
DO UPDATE SET
  "pisRate" = EXCLUDED."pisRate",
  "cofinsRate" = EXCLUDED."cofinsRate",
  "icmsRate" = EXCLUDED."icmsRate",
  "issRate" = EXCLUDED."issRate",
  "validFrom" = EXCLUDED."validFrom",
  "validUntil" = EXCLUDED."validUntil",
  "updatedAt" = CURRENT_TIMESTAMP,
  "cClassTrib" = EXCLUDED."cClassTrib",
  "cst" = EXCLUDED."cst";

-- Only unambiguous product mappings are automatic. Products using 99999999
-- remain untouched and will fail eligibility validation until corrected.
UPDATE "products" product
SET
  "ncmCode" = mapping.new_code,
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('85171200', '85171300'),
    ('64039900', '64039990'),
    ('85235100', '85235190'),
    ('84715000', '84715010')
) AS mapping(old_code, new_code)
WHERE product."ncmCode" = mapping.old_code;

-- ARCHIVED rules are retained for audit history and are excluded explicitly
-- by every eligibility and calculation query.
UPDATE "tax_rules"
SET
  "status" = 'ARCHIVED',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'ACTIVE'
  AND "ncmCode" IN (
    '85171200',
    '64039900',
    '85235100',
    '84715000',
    '99999999'
  );
