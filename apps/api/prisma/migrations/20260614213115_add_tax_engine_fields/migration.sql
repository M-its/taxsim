/*
  Warnings:

  - Added the required column `cClassTrib` to the `tax_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cst` to the `tax_rules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "municipioCode" INTEGER,
ADD COLUMN     "uf" VARCHAR(2);

-- AlterTable
ALTER TABLE "tax_rules" ADD COLUMN     "cClassTrib" VARCHAR(6) NOT NULL,
ADD COLUMN     "cst" VARCHAR(3) NOT NULL;
