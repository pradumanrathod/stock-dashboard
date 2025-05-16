import axios from "axios";

export const fetchStockData = async (symbol: string) => {
  const res = await axios.get(`http://localhost:5000/api/stock/${symbol}`);
  return res.data;
};
