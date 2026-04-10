import * as dashboardService from "../services/DashboardService.js";

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const data = await dashboardService.getMonthlyRevenue();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const data = await dashboardService.getTopSellingProducts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLatestOrders = async (req, res) => {
  try {
    const orders = await dashboardService.getLatestOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLatestUsers = async (req, res) => {
  try {
    const users = await dashboardService.getLatestUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getOrderStatusStats = async (req, res) => {
  try {
    const statusStats = await dashboardService.getOrderStatusStats();
    res.json(statusStats);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
