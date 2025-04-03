import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/ProductModel.js";

// Khởi tạo GoogleGenerativeAI với API key
const genAI = new GoogleGenerativeAI("AIzaSyB1PFojq35s-GwtD1bSPXb6MxqwCkV6ptg"); // Thay bằng API key thực của bạn

async function askQuestion(question) {
  try {
    // Lấy model Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Lấy danh sách sản phẩm từ database
    const products = await Product.find({}).limit(1000); // Giới hạn 5 sản phẩm

    // Tạo HTML cho danh sách sản phẩm
    const productHTML = products
      .map((product) => {
        // Xử lý đường dẫn ảnh từ database
        const imagePath = product.image
          ? `http://localhost:5000${product.image}` // Đảm bảo đường dẫn đầy đủ
          : "http://localhost:5000/uploads/no-image.png"; // Ảnh mặc định

        // Xử lý giá cả
        const formattedPrice = product.price
          ? `${product.price.toLocaleString("vi-VN")} VND`
          : "Liên hệ";

        return `
      <div class="product-card">
  <img src="${imagePath}" 
    alt="${product.name || "Sản phẩm"}" 
    class="product-image"
    onerror="this.src='http://localhost:5000/uploads/no-image.png'"
    loading="eager"
    decoding="async">
  
  <div class="product-info">
    <h3 class="product-name">${product.name || "Sản phẩm không có tên"}</h3>
    
    <div class="price-section">
      <span class="product-price">${formattedPrice}</span>
    </div>
    
    <div class="product-actions">
      <a href="http://localhost:5000/products/${
        product._id
      }" class="btn-view-detail">
        Xem chi tiết
      </a>
      <button class="btn-add-to-cart" data-id="${product._id}">
        Thêm vào giỏ
      </button>
    </div>
  </div>
</div>

<style>
.product-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn-view-detail {
  display: inline-block;
  padding: 8px 16px;
  background-color: #3b82f6; /* Màu xanh */
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  flex: 1;
}

.btn-view-detail:hover {
  background-color: #2563eb; /* Màu xanh đậm khi hover */
  transform: translateY(-1px);
}

.btn-add-to-cart {
  padding: 8px 16px;
  background-color: #f97316; /* Màu cam */
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.btn-add-to-cart:hover {
  background-color: #ea580c; /* Màu cam đậm khi hover */
  transform: translateY(-1px);
}
</style>
    `;
      })
      .join("");
    // Tạo prompt cho AI
    const prompt = `
     Bạn là một chatbot bán hàng chuyên nghiệp.
     Đây là danh sách sản phẩm hiện có trong cửa hàng (hiển thị theo dạng HTML):
     ${productHTML}
     
     Câu hỏi của khách hàng: "${question}"
     
     Nếu câu hỏi liên quan đến sản phẩm, hãy trả lời dựa trên danh sách sản phẩm trên.
     Nếu có thông tin sản phẩm hãy thêm nút thêm và giỏ hàng và nút xem chi tiết cho khách hàng
     Nếu khách hàng yêu cầu muốn mua một sản phẩm hãy tìm sản phẩm có tên gần nhất với yêu cầu đó
     Nếu không liên quan, hãy trả lời một cách tự nhiên và thân thiện.
     Hãy trả lời bằng HTML để dễ đọc hơn.
     Liên kết sản phẩm nên là: http://localhost:5173/products/ + id sản phẩm
     Liên kết hình ảnh nên là: http://localhost:5000/uploads/ + tên file ảnh
     Liên kết danh sachs sản phẩm nên là: http://localhost:5000/api/products
    `;
    // Gọi API Gemini để tạo nội dung
    const result = await model.generateContent(prompt);
    const answer = await result.response.text();
    return answer.replace(/```(html|plaintext)?\n/g, "").trim(); // Xóa mã không cần thiết
  } catch (error) {
    console.error("Lỗi khi xử lý câu hỏi: ", error);
    return `<p class="error-message">Xin lỗi, hiện tại tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau!</p>`;
  }
}

export default askQuestion;
