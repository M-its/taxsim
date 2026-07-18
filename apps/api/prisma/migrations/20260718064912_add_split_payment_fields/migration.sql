-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "cbsRetainedAmount" DECIMAL(10,4),
ADD COLUMN     "ibsRetainedAmount" DECIMAL(10,4),
ADD COLUMN     "splitPaymentResourceId" TEXT,
ADD COLUMN     "splitPaymentStatus" TEXT DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "split_payment_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "saleId" UUID NOT NULL,
    "resourceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ibsAmount" DECIMAL(10,4),
    "cbsAmount" DECIMAL(10,4),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_payment_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "split_payment_events" ADD CONSTRAINT "split_payment_events_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
