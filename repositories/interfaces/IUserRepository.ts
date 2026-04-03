// forced to use type any, since the User model have different shape
// based on database, especially for mongo, which has embedded fields/attributes

export interface IUserRepository {
  
  getAllUsers(): Promise<any[]>;
  getUserById(id: string): Promise<any[]>;

  createUser(data: Partial<any>): Promise<any[]>;
  
  updateUser(id: string, data: Partial<any>): Promise<any[]>;
  
  deleteUser(id: string): Promise<void>;



  getAllUserClosets(userId: string): Promise<any[]>;
  getAllOutfitsByUserId(userId: string): Promise<any[]>;
  getAllReviewsByUserId(userId: string): Promise<any[]>;
  getAllSharedClosetsByUserId(userId: string): Promise<any[]>; // will get all the closets that the user has shared with other users.

}

