import React, { useState, useEffect } from "react";
import {
  fetchCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/CategoryApi";
import Swal from "sweetalert2";
import { ICategory } from "../types/category";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Loader2,
  List,
  LayoutGrid
} from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ICategory[]>([]);
  
  // Form State
  const [categoryData, setCategoryData] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = categories.filter(
      cat => 
        cat.name.toLowerCase().includes(lowerTerm) || 
        cat.description.toLowerCase().includes(lowerTerm)
    );
    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategory();
      setCategories(data);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      Swal.fire("Lỗi", "Không thể tải danh sách danh mục", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (category?: ICategory) => {
    if (category) {
      setIsEditing(true);
      setEditingId(category._id);
      setCategoryData({ name: category.name, description: category.description });
    } else {
      setIsEditing(false);
      setEditingId(null);
      setCategoryData({ name: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset state after animation might be better, but immediate is fine for now
    setTimeout(() => {
        setIsEditing(false);
        setEditingId(null);
        setCategoryData({ name: "", description: "" });
    }, 200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryData.name.trim()) {
        Swal.fire("Cảnh báo", "Tên danh mục không được để trống", "warning");
        return;
    }

    const data = {
      name: categoryData.name,
      description: categoryData.description,
    };

    try {
      setIsLoading(true);
      if (isEditing && editingId) {
        await updateCategory(editingId, data);
        Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Cập nhật danh mục thành công!',
            timer: 1500,
            showConfirmButton: false
        });
      } else {
        await createCategory(data);
        Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã thêm danh mục mới!',
            timer: 1500,
            showConfirmButton: false
        });
      }
      closeModal();
      loadCategories();
    } catch (error) {
      Swal.fire("Lỗi", isEditing ? "Cập nhật thất bại" : "Thêm mới thất bại", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await deleteCategory(id);
        Swal.fire("Đã xóa!", "Danh mục đã được xóa.", "success");
        loadCategories();
      } catch (error) {
        Swal.fire("Lỗi", "Xóa danh mục không thành công", "error");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <LayoutGrid className="w-8 h-8 text-blue-600" />
                Quản Lý Danh Mục
            </h1>
            <p className="text-gray-500 mt-1">Quản lý các danh mục sản phẩm của cửa hàng</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Danh Mục</span>
        </button>
      </div>

      {/* Main Content card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="Tìm kiếm danh mục..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-gray-500">
                Hiển thị <span className="font-semibold text-gray-900">{filteredCategories.length}</span> danh mục
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tên Danh Mục
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && categories.length === 0 ? (
                <tr>
                    <td colSpan={3} className="px-6 py-10 text-center">
                        <div className="flex justify-center items-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                        </div>
                    </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                            <List className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Không tìm thấy danh mục nào.</p>
                        </div>
                    </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-1 max-w-md" title={category.description}>
                        {category.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(category)}
                        className="text-blue-600 hover:text-blue-900 mx-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="text-red-600 hover:text-red-900 mx-2 p-1 hover:bg-red-100 rounded-full transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
                    aria-hidden="true" 
                    onClick={closeModal}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Panel */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                                {isEditing ? "Chỉnh sửa Danh Mục" : "Thêm Danh Mục Mới"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 focus:outline-none p-1 rounded-full hover:bg-gray-100">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form id="categoryForm" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên danh mục <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={categoryData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Ví dụ: Đồ điện tử"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        id="description"
                                        rows={4}
                                        value={categoryData.description}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                        placeholder="Mô tả chi tiết về danh mục..."
                                        required
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="bg-gray-50/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                        <button
                            type="submit"
                            form="categoryForm"
                            disabled={isLoading}
                            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed items-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isEditing ? "Cập Nhật" : "Lưu Lại"}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                        >
                            Hủy bỏ
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
