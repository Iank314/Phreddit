import axios from "axios";

const API =  "http://localhost:8000/api/users";
export async function login(email, password) 
{
  const { data } = await axios.post(`${API}/login`, { email, password });
  localStorage.setItem("token", data.token);
  return data.user;
}

export function logout() {
  localStorage.removeItem("token");
}

export function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}