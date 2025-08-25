import axios from "axios";
import { api } from "../api";

export async function checkToken(): Promise<boolean> {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    await axios.get(api("/api/sessions"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch (err) {
    return false;
  }
}