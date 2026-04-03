import type { Request, Response } from "express";
import { UserService } from "../services/UserService.js";

export class UserController {
  constructor(private userService: UserService) {}

  getAllUsers = async (req: Request, res: Response) => {
    const users = await this.userService.getAllUsers();
    res.send(users);
  };

  getUserById = async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    } 

    const user = await this.userService.getUserById(userId);
    if (!user) return res.status(404).send({ error: "User not found" });
    res.send(user);
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).send(user);

    } catch (err: any) {
      res.status(400).send({ error: err.message });
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