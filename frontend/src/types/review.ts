// types/review.ts
export interface IReview {
  _id?: string;
  name: string; // hoặc có thể là { name: string } tùy backend trả về
  rating: number;
  comment: string;
  createdAt: string;
  user: string; 
}
