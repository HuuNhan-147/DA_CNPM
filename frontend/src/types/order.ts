export interface Order {
  _id: string;
  orderCode: string;
  user: {
    name: string;
    email: string;
  };
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string;
}