export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  phone: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
