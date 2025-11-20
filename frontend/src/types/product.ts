// Định nghĩa kiểu cho Review (đánh giá sản phẩm)
export interface IReview {
  user: string; // ID của người dùng (ObjectId)
  name: string; // Tên người đánh giá
  rating: number; // Số sao (1-5)
  comment: string; // Nội dung bình luận
  createdAt: string; // Ngày tạo đánh giá
  updatedAt: string; // Ngày cập nhật đánh giá
}

// Định nghĩa kiểu cho Product (sản phẩm)
export interface IProduct {
  _id: string; // ID của sản phẩm (ObjectId)
  name: string; // Tên sản phẩm
  price: number; // Giá sản phẩm
  image: string; // Ảnh sản phẩm (URL)
  category: string; // ID của danh mục sản phẩm (ObjectId)
  rating: number; // Điểm đánh giá trung bình
  countInStock: number; // Số lượng sản phẩm trong kho
  description: string; // Mô tả sản phẩm
  numReviews: number; // Số lượng đánh giá
  reviews: IReview[]; // Danh sách đánh giá
  createdAt: string; // Ngày tạo sản phẩm
  updatedAt: string; // Ngày cập nhật sản phẩm
  quantity: number; // Chỉ thêm số lượng vào đối tượng giỏ hàng
}
// Định nghĩa kiểu cho tham số tìm kiếm sản phẩm
export interface IProductSearchParams {
  keyword?: string; // Dùng cho backend
  category?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  rating?: string | number; // Giá trị từ 1 đến 5
  sortBy?: string; // Các giá trị có thể là "latest", "priceLowHigh", "priceHighLow", "bestSelling"
}
export interface IProductUpdate {
  _id: string; // ID của sản phẩm (ObjectId)
  name?: string;
  price?: number;
  category?: string;
  rating?: number;
  countInStock?: number;
  description?: string;
  image?: File | null;
}
