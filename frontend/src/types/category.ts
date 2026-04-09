export interface ICategory {
  _id: string;
  name: string;
  description: string;
  image?: string; // Tùy chọn, vì có thể không có ảnh
}
