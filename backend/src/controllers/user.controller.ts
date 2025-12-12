import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response.util';
import { Logger } from '../utils/logger.util';

export class UserController {
  /**
   * Get all users
   */
  static async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      ResponseUtil.success(res, users, 'Users retrieved successfully');
    } catch (error) {
      Logger.error('Error in getAllUsers:', error);
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      ResponseUtil.success(res, user, 'User retrieved successfully');
    } catch (error) {
      Logger.error('Error in getUserById:', error);
      next(error);
    }
  }

  /**
   * Create a new user
   */
  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        ResponseUtil.badRequest(res, 'Name and email are required');
        return;
      }

      const user = await UserService.createUser({ name, email });
      ResponseUtil.success(res, user, 'User created successfully', 201);
    } catch (error) {
      Logger.error('Error in createUser:', error);
      next(error);
    }
  }

  /**
   * Update user by ID
   */
  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const user = await UserService.updateUser(id, { name, email });

      if (!user) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      ResponseUtil.success(res, user, 'User updated successfully');
    } catch (error) {
      Logger.error('Error in updateUser:', error);
      next(error);
    }
  }

  /**
   * Delete user by ID
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await UserService.deleteUser(id);

      if (!deleted) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      ResponseUtil.success(res, null, 'User deleted successfully');
    } catch (error) {
      Logger.error('Error in deleteUser:', error);
      next(error);
    }
  }
}

