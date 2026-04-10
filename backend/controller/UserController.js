import * as userService from "../services/UserService.js";

export const createUser = async (req, res) => {
  try {
    const { newUser, accessToken, refreshToken } = await userService.createUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Tạo tài khoản thành công!",
      accessToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        isAdmin: newUser.isAdmin,
      },
    });
  } catch (error) {
    res.status(error.message === "Email đã tồn tại!" ? 400 : 500).json({ 
      message: error.message || "Lỗi server!" 
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await userService.loginUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Đăng nhập thành công!",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có quyền truy cập!" });
    }
    const user = await userService.getUserProfile(req.user);
    res.status(200).json(user);
  } catch (error) {
    res.status(error.message === "Người dùng không tồn tại!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user, req.body);
    res.status(200).json({ message: "Cập nhật thành công!", user });
  } catch (error) {
    res.status(error.message === "Người dùng không tồn tại!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: "Xóa người dùng thành công!" });
  } catch (error) {
    res.status(error.message === "Người dùng không tồn tại!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const user = await userService.updateUserByAdmin(req.params.id, req.body);
    res.status(200).json({ message: "Cập nhật thành công!", user });
  } catch (error) {
    res.status(error.message === "Người dùng không tồn tại!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
    }
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await userService.getUserOrders(req.user._id);
    res.status(200).json(orders);
  } catch (error) {
    res.status(error.message === "Không có đơn hàng nào!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await userService.forgotPassword(req.body.email);
    res.status(200).json({ message: "Email đặt lại mật khẩu đã được gửi!" });
  } catch (error) {
    res.status(error.message === "Không tìm thấy email!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    await userService.resetPassword(req.params.token, req.body.password);
    res.status(200).json({ message: "Mật khẩu đã được cập nhật!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Hiển thị trang nhập mật khẩu mới (Dùng để test hoặc khi không có frontend tương ứng)
export const resetPasswordPage = (req, res) => {
  res.send(`<h2>Nhập mật khẩu mới</h2>
            <form action="/api/users/reset-password/${req.params.token}" method="POST">
              <input type="password" name="password" placeholder="Mật khẩu mới" required />
              <button type="submit">Đổi mật khẩu</button>
            </form>`);
};

export const updatePassword = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
    }
    await userService.updatePassword(req.user._id, req.body.oldPassword, req.body.newPassword);
    res.status(200).json({ message: "Cập nhật mật khẩu thành công!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(error.message === "Người dùng không tồn tại!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Từ khóa tìm kiếm không được để trống" });
    }
    const users = await userService.searchUsers(query);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
