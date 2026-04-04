-- DropForeignKey
ALTER TABLE "outfits" DROP CONSTRAINT "outfits_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_writtenBy_fkey";

-- AddForeignKey
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_writtenBy_fkey" FOREIGN KEY ("writtenBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
