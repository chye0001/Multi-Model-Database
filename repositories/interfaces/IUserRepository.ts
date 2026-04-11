// forced to use type any, since the User model have different shape
// based on database, especially for mongo, which has embedded fields/attributes

// export type User = {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   createdAt: Date;
//   role: string;
//   country: Country;
//   fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
// };

// export type Closet = {
//   id: number;
//   name: string;
//   description?: string | null;
//   isPublic: boolean;
//   createdAt: Date;
//   userId: string;
//   fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
// }

// export type Outfit = {
//   id: number;
//   name: string;
//   style: string;
//   datedAdded: Date;
//   createdBy: string; // userId
//   items: ClothingItem[];
//   reviews: Review[];
//   fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
// }

// export type ClothingItem = {
//   id: number;
//   name: string;
//   price?: number | null;
//   category: string;
//   brand: Brand;
//   images: ItemImage[];
// }

// export type Brand = {
//   id: number;
//   name: string;
//   country?: Country;
// }

// export type Country = {
//   id: number;
//   name: string;
//   countryCode: string;
// }

// export type ItemImage = {
//   id: number;
//   url: string;
// }

// export type Review = {
//   id?: number | null | undefined;
//   score: number;
//   text: string;
//   dateWritten: Date;
//   outfitId?: number;
//   writtenBy: string; // userId
//   fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
// }

// export type SharedCloset = {
//   id: number;
//   name: string;
//   description?: string | null;
//   isPublic: boolean;
//   createdAt: Date;
//   userId: string; // userId of the owner of the closet
//   sharedWith: string[]; // array of userIds that the closet is shared with
//   itemIds: number[];
//   fromDatabase?: string; // just to distinguish the source of the data, not a real field in the database
// }

export interface IUserRepository {
  
  getAllUsers(): Promise<any[]>;
  getUserById(id: string): Promise<any[]>;

  createUser(data: Partial<any>): Promise<any[]>;
  
  updateUser(id: string, data: Partial<any>): Promise<any[]>;
  
  deleteUser(id: string): Promise<void>;



  assignRole(userId: string, roleName: string): Promise<any[]>;

  getAllUserClosets(userId: string): Promise<any[]>;
  getAllOutfitsByUserId(userId: string): Promise<any[]>;
  getAllReviewsByUserId(userId: string): Promise<any[]>;
  getAllSharedClosetsByUserId(userId: string): Promise<any[]>; // will get all the closets that the user has shared with other users.

}

