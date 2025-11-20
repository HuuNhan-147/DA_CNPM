import React from "react";
import AppRoutes from "./routes"; // Chỉ import routes, không cần bọc Router

const App = () => {
  return <AppRoutes />; // Không bọc Router ở đây
};

export default App;
