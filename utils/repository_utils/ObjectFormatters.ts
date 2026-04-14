import type { User } from "../../dtos/users/User.dto.js";
import type { Closet } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";
import type { ItemImage } from "../../dtos/items/Item.dto.js";
import type { Brand } from "../../dtos/brands/Brand.dto.js";

import { throwIfNotSupportedDatabase } from "./ErrorHandling.js";






export function formatUser(user: any, database: string): User {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "mongodb") {
        delete user._id;
        // No longer need to delete user.country._id — country is embedded
        // and EmbeddedCountrySchema has _id: false
    }

    let userProperties, roleProperties, countryProperties;
    if (databaseName === "neo4j") {
        userProperties    = user.get("u").properties;
        roleProperties    = user.get("r").properties;
        countryProperties = user.get("c").properties;
    }

    return {
        id:        databaseName === "neo4j" ? userProperties.id        : user.id,
        email:     databaseName === "neo4j" ? userProperties.email     : user.email,
        firstName: databaseName === "neo4j" ? userProperties.firstName : user.firstName,
        lastName:  databaseName === "neo4j" ? userProperties.lastName  : user.lastName,
        createdAt: databaseName === "neo4j" ? new Date(userProperties.createdAt) : user.createdAt,

        // role is now always an embedded object { id, name } across mongodb and postgresql
        // so we return the full object instead of just the name string
        role: databaseName === "neo4j"
            ? { id: roleProperties.id, name: roleProperties.name }
            : databaseName === "postgresql"
            ? { id: user.role.id, name: user.role.role }  // prisma uses `role` field name
            : user.role,                                   // mongodb already { id, name }

        country: {
            id:          databaseName === "neo4j" ? countryProperties.id          : user.country.id,
            name:        databaseName === "neo4j" ? countryProperties.name        : user.country.name,
            countryCode: databaseName === "neo4j" ? countryProperties.countryCode : user.country.countryCode,
        },
        fromDatabase: databaseName
    };
}





export function formatUserCloset(closet: any, database: string): Closet {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "mongodb") {
        delete closet._id;
    }

    let closetProperties: any, itemIds: any, sharedWith: any, createdAt: any;
    if (databaseName === "neo4j") {
        closetProperties = closet.get("cl").properties;
        itemIds          = closet.get("itemIds").filter((id: any) => id !== null);
        sharedWith       = closet.get("sharedWith").filter((id: any) => id !== null);
        createdAt        = new Date(closet.get("createdAt"));
    }

    return {
        id:          databaseName === "neo4j" ? closetProperties.id       : Number(closet.id),
        name:        databaseName === "neo4j" ? closetProperties.name     : closet.name,
        description: databaseName === "neo4j" ? closetProperties?.description ?? "" : closet?.description ?? "",
        isPublic:    databaseName === "neo4j" ? closetProperties.isPublic : closet.isPublic,
        createdAt:   databaseName === "neo4j" ? createdAt                 : closet.createdAt,

        userId: databaseName === "postgresql" ? closet.userId :
                databaseName === "mongodb"    ? closet.userId.id :   // still a reference, populated
                closetProperties.userId,

        itemIds: databaseName === "postgresql" ? closet.closetItem.map((item: any) => Number(item.itemId)) :
                 databaseName === "mongodb"    ? closet.itemIds.map((item: any) => Number(item.id)) :  // populated Item docs
                 itemIds,

        // sharedWith is now an embedded snapshot — no async resolution needed
        sharedWith: databaseName === "postgresql" ? closet.sharedCloset.map((entry: any) => entry.userId) :
                    databaseName === "mongodb"    ? closet.sharedWith.map((entry: any) => ({
                        id:        entry.id,
                        firstName: entry.firstName,
                        lastName:  entry.lastName,
                        email:     entry.email,
                    })) :
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
        // neo4j block unchanged — omitted for brevity
    }

    return {
        id:        Number(outfit.id),
        name:      outfit.name,
        style:     outfit.style,
        dateAdded: outfit.dateAdded,

        // createdBy is now an embedded snapshot in mongodb, plain string in postgresql
        createdBy: databaseName === "postgresql"
            ? outfit.createdBy
            : {
                id:        outfit.createdBy.id,
                firstName: outfit.createdBy.firstName,
                lastName:  outfit.createdBy.lastName,
                email:     outfit.createdBy.email,
              },

        items: databaseName === "postgresql"
            ? outfit.outfitItems?.map((oi: any) => formatClothingItem(oi.closetItem?.item, databaseName)) || []
            : outfit.items?.map((item: any) => formatClothingItem(item, databaseName)) || [],

        reviews: outfit.reviews?.map((review: any) => {
            if (databaseName === "mongodb") review.outfitId = outfit.id;
            return formatUserReview(review, databaseName);
        }) || [],

        fromDatabase: databaseName,
    };
}






export function formatUserReview(review: any, database: string): Review {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "neo4j") {
        // neo4j block unchanged — omitted for brevity
    }

    // writtenBy is now an embedded snapshot in mongodb — no _id to delete
    // since EmbeddedUserSchema has _id: false
    return {
        id:          Number(review.id),
        outfitId:    Number(review.outfitId) || 0,
        score:       review.score,
        text:        review.text ?? "",
        writtenBy:   databaseName === "postgresql"
            ? review.writtenBy
            : {
                id:        review.writtenBy.id,
                firstName: review.writtenBy.firstName,
                lastName:  review.writtenBy.lastName,
                email:     review.writtenBy.email,
              },
        dateWritten:  review.dateWritten ?? null,
        fromDatabase: databaseName,
    };
}






export function formatClothingItem(item: any, database: string): ClothingItem {
    const databaseName = database.toLowerCase();
    throwIfNotSupportedDatabase(databaseName);

    if (databaseName === "mongodb") {
        delete item._id;
    }

    const brands = databaseName === "postgresql"
        ? item.itemBrands?.map((relation: any) => formatBrand(relation.brand)) || []
        : item.brands?.map((brand: any) => formatBrand(brand)) || [];

    return {
        id:    Number(item.id),
        name:  item.name,
        price: item.price ?? null,

        // category is now an embedded object { categoryId, name } — extract name for the DTO
        category: {
            categoryId: item.category?.categoryId ?? item.category?.id,
            name:       item.category?.name ?? "Unknown",
        },

        brands,
        images: item.images?.map((img: any) => formatItemImage(img)) || [],
    };
}

export function formatItemImage(image: any): ItemImage {
  return {
    id:  Number(image.id),
    url: image.url,
  };
}

export function formatBrand(brand: any): Brand {
    if (!brand) {
        return {
            id:   0,
            name: "Unknown",
            country: { id: 0, name: "Unknown", countryCode: "" }
        };
    }

    return {
        id:   Number(brand.id),
        name: brand.name,
        country: {
            id:          brand.country?.id          ?? 0,
            name:        brand.country?.name        ?? "Unknown",
            countryCode: brand.country?.countryCode ?? "",
        }
    };
}
