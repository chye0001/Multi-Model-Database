-- View: Outfit overview with creator and item count
CREATE OR REPLACE VIEW outfit_overview AS
SELECT
    o.id,
    o.name,
    o.style,
    o."dateAdded",
    u."firstName",
    u."lastName",
    COUNT(oi.id) AS item_count
FROM outfits o
         JOIN users u ON o."createdBy" = u.id
         LEFT JOIN outfit_items oi ON o.id = oi."outfitId"
GROUP BY
    o.id,
    o.name,
    o.style,
    o."dateAdded",
    u."firstName",
    u."lastName";


-- Function: Calculate total price of an outfit
CREATE OR REPLACE FUNCTION calculate_outfit_price(outfit_id BIGINT)
RETURNS DECIMAL AS $$
DECLARE
total_price DECIMAL := 0;
BEGIN
SELECT SUM(i.price)
INTO total_price
FROM outfit_items oi
         JOIN closet_items ci ON oi."closetItemId" = ci.id
         JOIN items i ON ci."itemId" = i.id
WHERE oi."outfitId" = outfit_id;

RETURN COALESCE(total_price, 0);
END;
$$ LANGUAGE plpgsql;


-- Procedure: Create new outfit for a user
CREATE OR REPLACE PROCEDURE create_outfit(
    outfit_name TEXT,
    outfit_style TEXT,
    user_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
INSERT INTO outfits(name, style, "createdBy")
VALUES (outfit_name, outfit_style, user_id);
END;
$$;


-- Trigger function: Prevent negative item prices
CREATE OR REPLACE FUNCTION check_item_price()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.price IS NOT NULL AND NEW.price < 0 THEN
        RAISE EXCEPTION 'Price cannot be negative';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger: Attach price validation to items table
CREATE TRIGGER validate_item_price
    BEFORE INSERT OR UPDATE ON items
                         FOR EACH ROW
                         EXECUTE FUNCTION check_item_price();


-- Function: Delete reviews older than 2 years (requires createdAt column)
CREATE OR REPLACE FUNCTION delete_old_reviews()
RETURNS VOID AS $$
BEGIN
DELETE FROM reviews
WHERE "createdAt" < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;