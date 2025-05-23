import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI("AIzaSyB1PFojq35s-GwtD1bSPXb6MxqwCkV6ptg");

async function fetchDashboardData(token) {
  const urls = {
    stats: "http://localhost:5000/api/dashboard/stats",
    monthlyRevenue: "http://localhost:5000/api/dashboard/monthly-revenue",
    topProducts: "http://localhost:5000/api/dashboard/top-products",
    latestOrders: "http://localhost:5000/api/dashboard/latest-orders",
    latestUsers: "http://localhost:5000/api/dashboard/latest-users",
    orderStatus: "http://localhost:5000/api/dashboard/order-status",
  };

  try {
    const responses = await Promise.all(
      Object.values(urls).map((url) =>
        axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      )
    );

    const [
      statsRes,
      monthlyRevenueRes,
      topProductsRes,
      latestOrdersRes,
      latestUsersRes,
      orderStatusRes,
    ] = responses;

    return {
      stats: statsRes.data,
      monthlyRevenue: monthlyRevenueRes.data,
      topProducts: topProductsRes.data,
      latestOrders: latestOrdersRes.data,
      latestUsers: latestUsersRes.data,
      orderStatus: orderStatusRes.data,
    };
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", error.message);
    return null;
  }
}

async function askAdminQuestion(question, token) {
  try {
    const data = await fetchDashboardData(token);
    if (!data) {
      return `<p class="error-message">Không thể lấy dữ liệu dashboard.</p>`;
    }

    // HTML hiển thị dashboard
    const dashboardHtml = `
        <div class="dashboard-chat-response">
          <div class="card">
            <h3>📊 Thống kê tổng quan</h3>
            <div class="row"><span class="label">Tổng sản phẩm:</span> <span class="value">${
              data.stats.totalProducts
            }</span></div>
            <div class="row"><span class="label">Tổng người dùng:</span> <span class="value">${
              data.stats.totalUsers
            }</span></div>
            <div class="row"><span class="label">Tổng đơn hàng:</span> <span class="value">${
              data.stats.totalOrders
            }</span></div>
            <div class="row"><span class="label">Tổng doanh thu:</span> <span class="value">${data.stats.totalRevenue.toLocaleString(
              "vi-VN"
            )} VND</span></div>
          </div>
          <div class="card">
            <h3>📅 Doanh thu theo tháng</h3>
            <ul>
              ${data.monthlyRevenue
                .map(
                  (item) => `
                <li><span class="label">${
                  item._id
                }:</span> <span class="value">${item.totalRevenue.toLocaleString(
                    "vi-VN"
                  )} VND</span></li>
              `
                )
                .join("")}
            </ul>
          </div>
          <div class="card">
            <h3>🔥 Top 5 sản phẩm bán chạy</h3>
            <ul>
              ${data.topProducts
                .map(
                  (p, idx) => `
                <li><span class="label">${idx + 1}. ${
                    p.name
                  }</span> <span class="value">(${
                    p.totalSold
                  } đã bán)</span></li>
              `
                )
                .join("")}
            </ul>
          </div>
          <div class="card">
            <h3>🛒 Đơn hàng mới nhất</h3>
            <ul>
              ${data.latestOrders
                .map(
                  (order) => `
                <li><span class="label">#${
                  order.orderCode
                }</span> - <span class="value">${
                    order.user?.name || "Khách"
                  }</span> (${
                    order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"
                  })</li>
              `
                )
                .join("")}
            </ul>
          </div>
          <div class="card">
            <h3>🧑‍💻 Người dùng mới</h3>
            <ul>
              ${data.latestUsers
                .map(
                  (u) => `
                <li><span class="label">${u.name}</span> - <span class="value">${u.email}</span></li>
              `
                )
                .join("")}
            </ul>
          </div>
          <div class="card">
            <h3>📦 Trạng thái đơn hàng</h3>
            <ul>
              ${Object.entries(data.orderStatus)
                .map(
                  ([key, value]) => `
                <li><span class="label">${key}:</span> <span class="value">${value}</span></li>
              `
                )
                .join("")}
            </ul>
          </div>
      `;

    // Chuẩn bị dữ liệu dashboard dạng JSON string để nhồi vào prompt
    const dataJsonString = JSON.stringify(data);

    // Prompt cho chatbot với dữ liệu nổi bật được nhồi vào
    const prompt = `
  Bạn là trợ lý ảo cho quản trị viên cửa hàng. Dưới đây là dữ liệu thống kê bán hàng hiện có:
  ${dataJsonString}
  
  Dựa trên các dữ liệu trên (doanh thu, đơn hàng, người dùng, sản phẩm bán chạy, trạng thái đơn hàng, v.v), hãy phân tích các điểm nổi bật quan trọng nhất để hỗ trợ admin hiểu tình hình kinh doanh.
  
  Câu hỏi của admin là:
  "${question}"
  
  Bạn KHÔNG cần lặp lại toàn bộ dữ liệu. Thay vào đó, hãy chọn lọc và phân tích các dữ liệu nổi bật, đưa ra nhận xét chuyên sâu, xu hướng quan trọng, và gợi ý hành động phù hợp để cải thiện doanh thu, quản lý đơn hàng hoặc phát triển khách hàng.
  
  Ngữ điệu nên mang tính phân tích, chính xác, chuyên nghiệp và hỗ trợ quyết định.
  `;

    // Gọi AI để lấy câu trả lời phân tích
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const answer = await result.response.text();
    const cleanAnswer = answer.replace(/```(html|plaintext)?\n/g, "").trim();

    // Ghép phần trả lời chatbot vào cuối HTML
    const finalHtml = `
        ${dashboardHtml}
        <div class="card">
          <h3>🧠 Trợ lý trả lời:</h3>
          <p class="question">"${question}"</p>
          <p class="answer">${cleanAnswer}</p>
        </div>
        </div>
      `;

    return finalHtml;
  } catch (error) {
    console.error("Lỗi xử lý câu hỏi admin:", error);
    return `<p class="error-message">Đã có lỗi xảy ra khi trả lời câu hỏi.</p>`;
  }
}

export default askAdminQuestion;
