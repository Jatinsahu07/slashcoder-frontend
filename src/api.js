// src/api.js
import axios from "axios";
import { API_BASE } from "./config";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Example: Signup user
export const signupUser = async (email, password) => {
  try {
    const response = await api.post("/auth/signup", { email, password });
    return response.data;
  } catch (error) {
    console.error("Signup error:", error.response?.data || error.message);
    throw error;
  }
};

export default api;
