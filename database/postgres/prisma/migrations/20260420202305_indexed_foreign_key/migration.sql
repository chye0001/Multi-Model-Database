-- CreateIndex
CREATE INDEX "brands_countryId_idx" ON "brands"("countryId");

-- CreateIndex
CREATE INDEX "closet_items_closetId_idx" ON "closet_items"("closetId");

-- CreateIndex
CREATE INDEX "closets_userId_idx" ON "closets"("userId");

-- CreateIndex
CREATE INDEX "images_itemId_idx" ON "images"("itemId");

-- CreateIndex
CREATE INDEX "item_brands_brandId_idx" ON "item_brands"("brandId");

-- CreateIndex
CREATE INDEX "items_categoryId_idx" ON "items"("categoryId");

-- CreateIndex
CREATE INDEX "outfit_items_closetItemId_idx" ON "outfit_items"("closetItemId");

-- CreateIndex
CREATE INDEX "outfits_createdBy_idx" ON "outfits"("createdBy");

-- CreateIndex
CREATE INDEX "reviews_writtenBy_idx" ON "reviews"("writtenBy");

-- CreateIndex
CREATE INDEX "reviews_outfitId_idx" ON "reviews"("outfitId");

-- CreateIndex
CREATE INDEX "shared_closets_userId_idx" ON "shared_closets"("userId");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_countryId_idx" ON "users"("countryId");
