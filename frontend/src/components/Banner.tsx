import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import { fetchCategory } from "../api/CategoryApi";
import { ICategory } from "../types/category";

const images = [banner1, banner2, banner3];

const categoryBrandsById: Record<string, string[]> = {
  "67e17dbc476cbfe4dc4dfe02": ["Iphone", "Samsung", "Xiaomi", "Oppo", "Vivo"], // Điện Thoại & Phụ Kiện
  "67e17df8476cbfe4dc4dfe06": ["Dell", "HP", "Acer", "MacBook", "Asus"], // Laptop & Máy Tính
  "67e17e9d476cbfe4dc4dfe0a": ["Rolex", "Omega", "Casio", "Seiko", "Citizen"], // Đồng Hồ
  "67e17ea9476cbfe4dc4dfe0e": ["Samsung", "LG", "Sony", "TCL", "Hisense"], // Tivi
  "67e17ed2476cbfe4dc4dfe12": [
    "Tai nghe",
    "Chuột",
    "Bàn phím",
    "Sạc dự phòng",
    "Ốp lưng",
  ], // Phụ kiện
};

const priceRanges = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2 - 4 triệu", min: 2000000, max: 4000000 },
  { label: "4 - 10 triệu", min: 4000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: 0 },
];

const Banner = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    const getCategories = async () => {
      try {
        const data = await fetchCategory();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };

    getCategories();

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (category: ICategory) => {
    setSelectedCategory(category);
  };

  const handleBrandClick = (brand: string) => {
    if (!selectedCategory) return;

    const searchParams = new URLSearchParams();
    searchParams.append("keyword", brand.split("(")[0].trim());
    searchParams.append("category", selectedCategory._id);
    searchParams.append("sortBy", "latest");

    navigate(`/products/search?${searchParams.toString()}`);
  };

  const handlePriceRangeClick = (priceRange: (typeof priceRanges)[0]) => {
    if (!selectedCategory) return;

    const searchParams = new URLSearchParams();
    searchParams.append("category", selectedCategory._id);
    if (priceRange.min > 0)
      searchParams.append("minPrice", priceRange.min.toString());
    if (priceRange.max > 0)
      searchParams.append("maxPrice", priceRange.max.toString());
    searchParams.append("sortBy", "latest");

    navigate(`/products/search?${searchParams.toString()}`);
  };

  const getBrandsForCategory = (categoryId: string) => {
    return categoryBrandsById[categoryId] || ["Không có hãng nào"];
  };

  return (
    <section className="relative w-full h-[400px] bg-white overflow-hidden">
      {/* Banner image */}
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="absolute inset-0 flex justify-center items-center">
        <img
          src={images[currentImage]}
          alt="Banner"
          className="max-w-full max-h-full object-contain transition-opacity duration-500"
        />
      </div>

      {/* Three-column layout */}
      <div className="relative h-full container mx-auto flex">
        {/* Categories panel */}
        <div className="w-1/5 h-full pr-4 flex">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs h-full overflow-y-auto">
            <h3 className="font-bold text-2xl mb-4 text-gray-800 border-b pb-3 border-gray-200">
              Danh Mục
            </h3>
            <ul className="max-h-[300px] overflow-y-auto">
              {categories.map((category) => (
                <li
                  key={category._id}
                  className={`py-3 px-4 rounded-md cursor-pointer transition-colors text-lg ${
                    selectedCategory?._id === category._id
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main banner area */}
        <div className="flex-1 flex items-center justify-center"></div>

        {/* Brands and prices panel */}
        {selectedCategory && (
          <div className="w-1/5 h-full pr-4 flex">
            <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs h-full overflow-y-auto">
              <h3 className="font-bold text-xl mb-4 text-gray-800 border-b pb-3 border-gray-200">
                {selectedCategory.name}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Brands column */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-700">
                    Hãng
                  </h4>
                  <ul className="space-y-2">
                    {getBrandsForCategory(selectedCategory._id).map(
                      (brand, index) => (
                        <li
                          key={index}
                          className="py-2 px-3 text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 rounded transition-colors text-base"
                          onClick={() => handleBrandClick(brand)}
                        >
                          {brand}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Prices column */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-700">
                    Mức giá
                  </h4>
                  <ul className="space-y-2">
                    {priceRanges.map((range, idx) => (
                      <li
                        key={idx}
                        className="py-2 px-3 text-gray-700 hover:text-gray-900 cursor-pointer hover:bg-gray-50 rounded transition-colors text-base"
                        onClick={() => handlePriceRangeClick(range)}
                      >
                        {range.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shop now button */}
      <div className="absolute bottom-10 w-full flex justify-center">
        <button
          onClick={() => navigate("/products")}
          className="bg-white text-blue-700 px-10 py-3 rounded-full text-xl font-bold hover:bg-gray-100 transition duration-300 shadow-lg hover:shadow-xl hover:text-blue-800"
        >
          Mua ngay
        </button>
      </div>
    </section>
  );
};

export default Banner;
