import type { User } from "../../dtos/users/User.dto.js";
import type { Closet } from "../../dtos/closets/Closet.dto.js";
import type { ClothingItem } from "../../dtos/items/Item.dto.js";
import type { Outfit } from "../../dtos/outfits/Outfit.dto.js";
import type { Review } from "../../dtos/reviews/Review.dto.js";
import type { ItemImage } from "../../dtos/items/Item.dto.js";
import type { Brand } from "../../dtos/brands/Brand.dto.js";



export function formatUser(user: any, database: string): User {
    const databaseName = database.toLowerCase();
    if (databaseName !== "mongodb" && databaseName !== "postgresql" && databaseName !== "neo4j") {
        throw new Error(`Unsupported database name: ${database}. Expected "MongoDB", "PostgreSQL", or "Neo4j".`);
    }

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

    // result.records.map((record) => {
    //             const u = record.get("u").properties;
    //             const r = record.get("r").properties;
    //             const c = record.get("c").properties;

    //             return {
    //                 id:          u.id,
    //                 email:       u.email,
    //                 firstName:   u.firstName,
    //                 lastName:    u.lastName,
    //                 createdAt:   new Date(u.createdAt ?? Date.now()),
    //                 role:        r.name,
    //                 country: {
    //                 id:          c.id,
    //                 name:        c.name,
    //                 countryCode: c.countryCode,
    //                 },
    //                 fromDatabase: "Neo4j",
    //             };
}

export function formatUserCloset(closet: any, database: string): Closet {
    const databaseName = database.toLowerCase();
    
    if(databaseName === "mongodb") {
        delete closet._id;
    }

    return {
        id: Number(closet.id),
        name: closet.name,
        description: closet.description,
        isPublic: closet.isPublic,
        createdAt: closet.createdAt,
        userId: databaseName === "postgresql" ? closet.userId :
            databaseName === "mongodb" ? closet.userId.id :
            closet.userId,

        //@ts-ignore
        itemIds: databaseName === "postgresql" ? closet.closetItem.map( item => Number(item.itemId)) :
        //@ts-ignore
            databaseName === "mongodb" ? closet.itemIds.map( item => item.id) :
            [],

        //@ts-ignore
        sharedWith: databaseName === "postgresql" ? closet.sharedCloset.map( entry => entry.userId) :
            databaseName === "mongodb" ? closet.sharedWith.map((entry: any) => entry.user?.id) :
            [],

        fromDatabase: databaseName
    };
}

export function formatUserOutfit(outfit: any, database: string): Outfit {
  const databaseName = database.toLowerCase();

  if (databaseName === "mongodb") {
    delete outfit._id;
  }

  return {
    id: Number(outfit.id),
    name: outfit.name,
    style: outfit.style,
    dateAdded: outfit.dateAdded,

    createdBy: databaseName === "postgresql"
      ? outfit.createdBy          // Prisma returns full user object
      : outfit.createdBy?.id,     // MongoDB populate returns full user, grab UUID

    items: databaseName === "postgresql"
      ? outfit.outfitItems?.map((outfitItem: any) =>
          formatClothingItem(outfitItem.closetItem?.item, databaseName)) || []
      : outfit.itemIds?.map((item: any) =>
          formatClothingItem(item, databaseName)) || [],

    reviews: outfit.reviews?.map((review: any) =>
      formatUserReview(review, databaseName)) || [],

    fromDatabase: databaseName,
  };
}

export function formatUserReview(review: any, database: string): Review {
    const databaseName = database.toLowerCase();

    if (databaseName === "mongodb") {
        delete review.writtenBy._id;
    }

    return {
        id: Number(review.id),
        outfitId: databaseName === "postgresql" ? Number(review.outfitId) :
            databaseName === "mongodb" ? Number(review.outfitId) :
            0,

        score: review.score,
        text: review.text,

        writtenBy: databaseName === "postgresql" ? review.writtenBy :
            databaseName === "mongodb" ? review.writtenBy :
            0,     // neo4j

        dateWritten: review.dateWritten ?? null,
        fromDatabase: databaseName
    };
}



export function formatClothingItem(item: any, database: string): ClothingItem {
  const databaseName = database.toLowerCase();

  if (databaseName === "mongodb") {
    delete item._id;
  }

  const brands = databaseName === "postgresql"
    ? item.itemBrand?.map((relation: any) => formatBrand(relation.brand)) || []
    : item.brands?.map((brand: any) => formatBrand(brand)) || [];

  const images = databaseName === "postgresql"
    ? item.image
    : item.images;

  return {
    id: Number(item.id),
    name: item.name,
    price: item.price,
    category: item.category.name,
    brands,                                                    // ← now an array
    images: images?.map((img: any) => formatItemImage(img)) || [],
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
