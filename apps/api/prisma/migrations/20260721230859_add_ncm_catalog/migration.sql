-- CreateTable
CREATE TABLE "ncm_catalog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(8) NOT NULL,
    "description" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ncm_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ncm_catalog_code_key" ON "ncm_catalog"("code");

-- CreateIndex
CREATE INDEX "ncm_catalog_code_idx" ON "ncm_catalog"("code");
