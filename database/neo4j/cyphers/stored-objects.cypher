// Calculate total price of an outfit
MATCH (o:Outfit {id: $outfitId})-[:CONTAINS]->(i:Item)
RETURN coalesce(sum(coalesce(i.price, 0)), 0) AS total_price;
