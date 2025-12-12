import { IUser } from '../models/user.model';
import { Logger } from '../utils/logger.util';

export class UserService {
  // In-memory storage for demo purposes (replace with database in production)
  private static users: IUser[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<IUser[]> {
    Logger.debug('Fetching all users');
    return this.users;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<IUser | null> {
    Logger.debug(`Fetching user with id: ${id}`);
    const user = this.users.find((u) => u.id === id);
    return user || null;
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    Logger.debug('Creating new user');
    const newUser: IUser = {
      id: (this.users.length + 1).toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  /**
   * Update user by ID
   */
  static async updateUser(id: string, userData: Partial<Omit<IUser, 'id' | 'createdAt'>>): Promise<IUser | null> {
    Logger.debug(`Updating user with id: ${id}`);
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return null;
    }
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date(),
    };
    return this.users[userIndex];
  }

  /**
   * Delete user by ID
   */
  static async deleteUser(id: string): Promise<boolean> {
    Logger.debug(`Deleting user with id: ${id}`);
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return false;
    }
    this.users.splice(userIndex, 1);
    return true;
  }
}

