import axios from "axios";

export const fetchStockData = async (symbol: string) => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  const res = await axios.get(`${baseURL}/api/stock/${symbol}`);
  return res.data;
};
