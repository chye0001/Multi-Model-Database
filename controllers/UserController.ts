import type { Request, Response } from "express";
import { UserService } from "../services/UserService.js";

export class UserController {
  constructor(private userService: UserService) {}

  getAllUsers = async (req: Request, res: Response) => {
    const users = await this.userService.getAllUsers();
    res.send(users);
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const userId = req.params.id as string;
      if (!userId) {
        return res.status(400).send({ error: "User ID is required" });
      }

      const user = await this.userService.getUserById(userId);
      if (!user || (Array.isArray(user) && user.length === 0)) {
        return res.status(404).send({ error: "User not found" });
      }

      res.send(user);
      
    } catch (error: any) {
      console.error(`Error in getUserById controller for ID ${req.params.id}:`, error);
      res.status(500).send({ error: error?.message ?? "Internal Server Error" });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    } 
    
    const updated = await this.userService.updateUser(userId, req.body);
    res.send(updated);
  };

  deleteUser = async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    } 

    await this.userService.deleteUser(userId);
    res.status(204).send();
  };

  assignRole = async (req: Request, res: Response) => {
    try {
      const { userEmail, role } = req.body;
      if (!userEmail) {
        return res.status(400).send({ error: 'User email is required' });
      }
      if (!role) {
        return res.status(400).send({ error: 'Role name is required' });
      }
      const updated = await this.userService.assignRole(userEmail, role);
      res.send(updated);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to assign role' });
    }
  };

  // Relationship-based routes
  getUserClosets = async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    } 
    
    const closets = await this.userService.getAllUserClosets(userId);
    res.send(closets);
  };

  getUserOutfits = async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }

    const outfits = await this.userService.getAllOutfitsByUserId(userId);
    res.send(outfits);
  };

  getUserReviews = async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }
    const reviews = await this.userService.getAllReviewsByUserId(userId);
    res.send(reviews);
  };

  getSharedClosets = async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }
    const shared = await this.userService.getAllSharedClosetsByUserId(userId);
    res.send(shared);
  };
}