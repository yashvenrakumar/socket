export interface IUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User implements IUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IUser>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.email = data.email || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON(): IUser {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

