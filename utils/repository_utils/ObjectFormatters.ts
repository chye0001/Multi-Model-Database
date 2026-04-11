import type { User } from "../../dtos/users/User.dto.js";
import type { Closet } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";
import type { ItemImage } from "../../dtos/items/Item.dto.js";
import type { Brand } from "../../dtos/brands/Brand.dto.js";
import { throwIfNotSupportedDatabase } from "./ErrorHandling.js";
// At the top of the neo4j block in formatUserOutfit
import { integer } from "neo4j-driver";




export function formatUser(user: any, database: string): User {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "mongodb") {
        //@ts-ignore Remove the internal MongoDB _id field
        delete user._id;
        
        //@ts-ignore Remove the internal MongoDB _id field from the populated country
        delete user.country._id;
    }

    let userProperties, roleProperties, countryProperties;
    if (databaseName === "neo4j") {
        userProperties = user.get("u").properties;
        roleProperties = user.get("r").properties;
        countryProperties = user.get("c").properties;
    }

    return {
        id: databaseName === "neo4j" ? userProperties.id : user.id,
        email: databaseName === "neo4j" ? userProperties.email : user.email,
        firstName: databaseName === "neo4j" ? userProperties.firstName : user.firstName,
        lastName: databaseName === "neo4j" ? userProperties.lastName : user.lastName,
        createdAt: databaseName === "neo4j" ? new Date(userProperties.createdAt) : user.createdAt,

        role: databaseName === "mongodb" ? user.role.name :
            databaseName === "postgresql" ? user.role.role : 
            roleProperties.name,

        country: {
            id: databaseName === "neo4j" ? countryProperties.id : user.country.id,
            name: databaseName === "neo4j" ? countryProperties.name : user.country.name,
            countryCode: databaseName === "neo4j" ? countryProperties.countryCode : user.country.countryCode
        },
        fromDatabase: databaseName
    };
}





const neo4j = "neo4j";
export function formatUserCloset(closet: any, database: string): Closet {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if(databaseName === "mongodb") {
        delete closet._id;
    }

    let closetProperties: any, itemIds: any, sharedWith: any, createdAt: any;
    if (databaseName === "neo4j") {
        closetProperties = closet.get("cl").properties;
        itemIds = closet.get("itemIds").filter((id: any) => id !== null);
        sharedWith = closet.get("sharedWith").filter((id: any) => id !== null)
        createdAt = new Date(closet.get("createdAt"));
    }

    return {
        id: databaseName === neo4j ? closetProperties.id : Number(closet.id),
        name: databaseName === neo4j ? closetProperties.name: closet.name,
        description: databaseName === neo4j ? closetProperties?.description ?? "" : closet?.description ?? "",
        isPublic: databaseName === neo4j ? closetProperties.isPublic : closet.isPublic,
        createdAt: databaseName === neo4j ? createdAt : closet.createdAt,

        userId: databaseName === "postgresql" ? closet.userId :
            databaseName === "mongodb" ? closet.userId.id :
            closetProperties.userId,

        itemIds: databaseName === "postgresql" ? closet.closetItem.map( (item: any) => Number(item.itemId)) :
            databaseName === "mongodb" ? closet.itemIds.map( (item: any) => item.id) :
            itemIds,

        sharedWith: databaseName === "postgresql" ? closet.sharedCloset.map( (entry: any) => entry.userId) :
            databaseName === "mongodb" ? closet.sharedWith.map((entry: any) => entry.user?.id) :
            sharedWith,

        fromDatabase: databaseName
    };
}





export function formatUserOutfit(outfit: any, database: string): Outfit {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "mongodb") {
        delete outfit._id;
    }

    if (databaseName === "neo4j") {
        const o          = outfit.get("o").properties;
        const createdBy  = outfit.get("createdBy");
        const dateAdded = new Date(outfit.get("dateAdded"));
        const rawItems   = outfit.get("rawItems").filter((i: any) => i.id !== null);
        const rawBrands  = outfit.get("rawBrands").filter((b: any) => b.brandId !== null);
        const rawImages  = outfit.get("rawImages").filter((i: any) => i.imageId !== null);
        const rawReviews = outfit.get("rawReviews").filter((r: any) => r.id !== null);

        // Build item map from rawItems
        const itemMap = new Map<number, ClothingItem>();
        for (const row of rawItems) {
            const itemId = row.id;
            itemMap.set(itemId, {
                id:       itemId,
                name:     row.name,
                price:    row.price != null ? row.price : null,
                category: row.category ?? "Unknown",
                brands:   [],
                images:   [],
            });
        }

        // Attach brands to their items
        for (const row of rawBrands) {
            const itemId  = row.itemId;
            const brandId = row.brandId;
            const item    = itemMap.get(itemId);
            if (item && !item.brands.some(b => b.id === brandId)) {
                item.brands.push({ id: brandId, name: row.brandName });
            }
        }

        // Attach images to their items
        for (const row of rawImages) {
            const itemId  = row.itemId;
            const imageId = row.imageId;
            const item    = itemMap.get(itemId);
            if (item && !item.images.some(img => img.id === imageId)) {
                item.images.push({ id: imageId, url: row.imageUrl });
            }
        }

        return {
            id:          o.id,
            name:        o.name,
            style:       o.style,
            dateAdded,
            createdBy,
            items:       Array.from(itemMap.values()),
            reviews:     rawReviews.map((r: any) => formatUserReview(r, "neo4j")),
            fromDatabase: "neo4j",
        };
    }

    return {
        id:        Number(outfit.id),
        name:      outfit.name,
        style:     outfit.style,
        dateAdded: outfit.dateAdded,

        createdBy: databaseName === "postgresql"
        ? outfit.createdBy
        : outfit.createdBy?.id,

        items: databaseName === "postgresql"
        ? outfit.outfitItems?.map((outfitItem: any) =>
            formatClothingItem(outfitItem.closetItem?.item, databaseName)) || []
        : outfit.itemIds?.map((item: any) =>
            formatClothingItem(item, databaseName)) || [],

        reviews: databaseName === "postgresql" ? outfit.reviews?.map((review: any) => formatUserReview(review, databaseName)) :
            databaseName === "mongodb" ? outfit.reviews?.map((review: any) => {
                review.outfitId = outfit.id;
                return formatUserReview(review, databaseName);
            }) : 
            [],

        fromDatabase: databaseName,
    };
}





export function formatUserReview(review: any, database: string): Review {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "mongodb") {
        delete review.writtenBy._id;
    }

    if (databaseName === "neo4j") {
        const rv        = review.get("rv").properties;
        const outfitId  = review.get("outfitId");
        const dateWritten = review.get("dateWritten");
        const writtenBy = review.get("writtenBy");

        return {
            id:           rv.id,
            outfitId:     outfitId,
            score:        rv.score,
            text:         rv.text ?? "",
            writtenBy,
            dateWritten:  dateWritten ? new Date(dateWritten) : new Date(),
            fromDatabase: databaseName
        };
    }

    return {
        id:          Number(review.id),
        outfitId:    databaseName === "postgresql" ? Number(review.outfitId) :
                    databaseName === "mongodb"    ? Number(review.outfitId) : 0,
        score:       review.score,
        text:        review.text,
        writtenBy:   review.writtenBy,
        dateWritten: review.dateWritten ?? null,
        fromDatabase: databaseName,
    };
}




export function formatClothingItem(item: any, database: string): ClothingItem {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "mongodb") {
        delete item._id;
    }

    // Neo4j items are pre-formatted in formatUserOutfit via itemMap
    // so this formatter only handles postgresql and mongodb
    const brands = databaseName === "postgresql"
        ? item.itemBrands?.map((relation: any) => formatBrand(relation.brand)) || []
        : item.brands?.map((brand: any) => formatBrand(brand)) || [];

    const images = databaseName === "postgresql"
        ? item.images
        : item.images;

    return {
        id:       Number(item.id),
        name:     item.name,
        price:    item.price,
        category: item.category.name,
        brands,
        images:   images?.map((img: any) => formatItemImage(img)) || []
    };
}

export function formatItemImage(image: any): ItemImage {
  return {
    id: Number(image.id),
    url: image.url,
  };
}

export function formatBrand(brand: any): Brand {
    if (!brand) {
        return {
            id: 0,
            name: 'Unknown',
            // country: {
            //     id: 0,
            //     name: 'Unknown',
            //     countryCode: ''
            // }
        };
    }

    return {
        id: Number(brand.id),
        name: brand.name,
        // country: {
        //     id: brand.country.id,
        //     name: brand.country.name,
        //     countryCode: brand.country.countryCode
        // }
    };
}
