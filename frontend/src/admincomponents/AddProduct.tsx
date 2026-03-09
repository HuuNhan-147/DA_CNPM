import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addProduct } from "../api/productApi";
import { fetchCategory } from "../api/CategoryApi";

const AddProduct: React.FC = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState<number | string>(5);
  const [countInStock, setCountInStock] = useState<number | string>("");
  const [specifications, setSpecifications] = useState<
    { key: string; value: string; unit: string; group: string }[]
  >([]);

  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { getToken } = useAuth();
  const navigate = useNavigate();

  /* ======================
     FETCH CATEGORIES
  ====================== */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchCategory();
        setCategories(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        alert("❌ Không thể tải danh mục!");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  /* ======================
     HANDLE IMAGE CHANGE
  ====================== */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // ✅ Validate file type (Cloudinary chấp nhận)
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("❌ Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)!");
        e.target.value = "";
        return;
      }

      // ✅ Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("❌ File ảnh không được vượt quá 5MB!");
        e.target.value = "";
        return;
      }

      // ✅ Set file và preview
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  /* ======================
     SUBMIT FORM
  ====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      alert("❌ Bạn cần đăng nhập!");
      return;
    }

    // ✅ Validate required fields
    if (!name.trim()) {
      alert("❌ Vui lòng nhập tên sản phẩm!");
      return;
    }

    if (!price || Number(price) <= 0) {
      alert("❌ Vui lòng nhập giá sản phẩm hợp lệ!");
      return;
    }

    if (!category) {
      alert("❌ Vui lòng chọn danh mục!");
      return;
    }

    if (!countInStock || Number(countInStock) < 0) {
      alert("❌ Vui lòng nhập số lượng tồn kho hợp lệ!");
      return;
    }

    if (!image) {
      alert("❌ Vui lòng chọn ảnh sản phẩm!");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Tạo FormData đúng chuẩn cho Cloudinary upload
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("price", price.toString());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("rating", rating.toString());
      formData.append("countInStock", countInStock.toString());
      formData.append("specifications", JSON.stringify(specifications));
      formData.append("image", image); // ✅ File sẽ được Cloudinary xử lý

      console.log("📤 Đang gửi dữ liệu:");
      console.log("- Tên:", name);
      console.log("- Giá:", price);
      console.log("- Danh mục:", category);
      console.log("- Số lượng:", countInStock);
      console.log(
        "- File ảnh:",
        image.name,
        `(${(image.size / 1024).toFixed(2)} KB)`
      );

      const result = await addProduct(formData, token);

      console.log("✅ Phản hồi từ server:", result);
      alert("🎉 Thêm sản phẩm thành công!");

      // ✅ Reset form
      setName("");
      setPrice("");
      setDescription("");
      setCategory("");
      setCategory("");
      setRating(5);
      setCountInStock("");
      setSpecifications([]);
      setImage(null);
      setPreview(null);

      // ✅ Chuyển về trang danh sách sản phẩm
      navigate("/admin/products");
    } catch (error: any) {
      console.error("❌ Lỗi:", error);

      // ✅ Hiển thị lỗi chi tiết
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể thêm sản phẩm!";

      alert(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          ➕ Thêm Sản Phẩm Mới
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên sản phẩm"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Giá */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Giá sản phẩm (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập giá"
              min="0"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Mô tả */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Mô tả sản phẩm
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mô tả chi tiết sản phẩm"
              disabled={isSubmitting}
            />
          </div>

          {/* Thông số kỹ thuật */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Thông số kỹ thuật
              </label>
              <button
                type="button"
                onClick={() =>
                  setSpecifications([
                    ...specifications,
                    { key: "", value: "", unit: "", group: "" },
                  ])
                }
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition"
              >
                + Thêm thông số
              </button>
            </div>
            
            <div className="space-y-3">
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="Tên thông số (VD: RAM)"
                      value={spec.key}
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[index].key = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                    />
                     <input
                      type="text"
                      placeholder="Giá trị (VD: 8GB)"
                      value={spec.value}
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[index].value = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                    />
                     <input
                      type="text"
                      placeholder="Đơn vị (VD: GB)"
                      value={spec.unit}
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[index].unit = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                    />
                     <input
                      type="text"
                      placeholder="Nhóm (VD: Cấu hình)"
                      value={spec.group}
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[index].group = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newSpecs = specifications.filter((_, i) => i !== index);
                      setSpecifications(newSpecs);
                    }}
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              {specifications.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2 border-2 border-dashed border-gray-200 rounded-lg">
                  Chưa có thông số kỹ thuật nào
                </p>
              )}
            </div>
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Danh mục <span className="text-red-500">*</span>
            </label>
            {loadingCategories ? (
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50">
                <p className="text-gray-500">Đang tải danh mục...</p>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Đánh giá (1-5 sao)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="5"
              disabled={isSubmitting}
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Số lượng tồn kho <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={countInStock}
              onChange={(e) => setCountInStock(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập số lượng"
              min="0"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Image upload - ✅ Cloudinary sẽ xử lý */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Ảnh sản phẩm <span className="text-red-500">*</span>
            </label>

            <div className="space-y-4">
              {/* File input */}
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-600">
                      {image ? (
                        <span className="text-blue-600 font-medium">
                          {image.name}
                        </span>
                      ) : (
                        "📁 Chọn ảnh sản phẩm (JPG, PNG, WEBP - Max 5MB)"
                      )}
                    </span>
                  </div>
                </div>
              </label>

              {/* Preview - ✅ Local preview trước khi upload Cloudinary */}
              {preview && (
                <div className="flex items-start gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      Xem trước:
                    </p>
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-48 h-48 object-cover rounded-lg border-2 border-blue-300 shadow-md"
                    />
                  </div>
                  <div className="text-sm text-gray-500 mt-8">
                    <p>📦 Tên file: {image?.name}</p>
                    <p>
                      📊 Kích thước:{" "}
                      {image ? (image.size / 1024).toFixed(2) : 0} KB
                    </p>
                    <p className="text-xs mt-2 text-blue-600">
                      ✅ Ảnh này sẽ được tải lên Cloudinary khi bạn nhấn "Thêm
                      sản phẩm"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang tải lên Cloudinary...
                </>
              ) : (
                "➕ Thêm sản phẩm"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
