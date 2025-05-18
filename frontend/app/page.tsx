"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

// ✅ Type for each stock in the portfolio
type Stock = {
  name: string;
  symbol: string;
  purchasePrice: number;
  quantity: number;
  sector: string;
  cmp?: number;
  investment?: number;
  presentValue?: number;
  gainLoss?: number;
  peRatio?: string;
  latestEarnings?: string;
  error?: boolean;
};

const portfolioData: Stock[] = [
  { symbol: "AAPL", name: "Apple", purchasePrice: 120, quantity: 10, sector: "Technology" },
  { symbol: "TCS.NS", name: "TCS", purchasePrice: 3100, quantity: 5, sector: "Technology" },
  { symbol: "RELIANCE.NS", name: "Reliance", purchasePrice: 2500, quantity: 8, sector: "Energy" },
  { name: "HDFC Bank", purchasePrice: 1490, quantity: 50, symbol: "HDFCBANK.NS", sector: "Finance" },
  { name: "Affle India", purchasePrice: 1151, quantity: 50, symbol: "AFFLE.NS", sector: "Technology" },
  { name: "LTI Mindtree", purchasePrice: 4775, quantity: 16, symbol: "LTIM.NS", sector: "Technology" }
];

const columns = [
  "Stock", "Purchase Price", "Qty", "Investment", "CMP",
  "Present Value", "Gain/Loss", "Portfolio %", "P/E Ratio", "Earnings"
];

// ✅ Groups stocks by sector and aggregates totals
const groupBySector = (
  stocks: Stock[]
): Record<string, {
  stocks: Stock[];
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
}> =>
  stocks.reduce((acc: Record<string, {
    stocks: Stock[];
    totalInvestment: number;
    totalPresentValue: number;
    totalGainLoss: number;
  }>, stock) => {
    acc[stock.sector] ??= {
      stocks: [],
      totalInvestment: 0,
      totalPresentValue: 0,
      totalGainLoss: 0,
    };
    acc[stock.sector].stocks.push(stock);
    acc[stock.sector].totalInvestment += stock.investment || 0;
    acc[stock.sector].totalPresentValue += stock.presentValue || 0;
    acc[stock.sector].totalGainLoss += stock.gainLoss || 0;
    return acc;
  }, {});


export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔁 Fetch stock data from backend for each symbol
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        portfolioData.map(async (stock) => {
          try {
            const { data } = await axios.get(`http://localhost:5000/api/stock/${stock.symbol}`);
            const cmp = data.cmp;
            const investment = stock.purchasePrice * stock.quantity;
            const presentValue = cmp * stock.quantity;
            const gainLoss = presentValue - investment;

            return {
              ...stock,
              cmp,
              peRatio: data.peRatio,
              latestEarnings: data.latestEarnings,
              investment,
              presentValue,
              gainLoss
            };
          } catch {
            return { ...stock, error: true };
          }
        })
      );
      setStocks(results);
    } catch {
      setError("Failed to fetch portfolio data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalInvestment = useMemo(
    () => stocks.reduce((acc, stock) => acc + (stock.investment || 0), 0),
    [stocks]
  );

  const groupedSectors = useMemo(() => groupBySector(stocks), [stocks]);

  return (
    <div className="font-sans p-8 mt-10 max-w-7xl mx-auto bg-white shadow-xl rounded-xl">
      <h1 className="text-3xl font-semibold mb-6 text-gray-900">Portfolio Dashboard</h1>

      {/* ✅ Show loading message if loading */}
      {loading && <p className="text-gray-600 mb-4">Loading data...</p>}
      {error && <p className="text-red-600 font-semibold mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {Object.entries(groupedSectors).map(([sector, data]) => (
              <React.Fragment key={sector}>
                {/* ✅ Sector Summary Row */}
                <tr className="bg-gray-800 text-white font-semibold">
                  <td className="px-6 py-3" colSpan={3}>{sector}</td>
                  <td className="px-6 py-3">₹{data.totalInvestment.toFixed(2)}</td>
                  <td className="px-6 py-3">—</td>
                  <td className="px-6 py-3">₹{data.totalPresentValue.toFixed(2)}</td>
                  <td className={`px-6 py-3 ${data.totalGainLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ₹{data.totalGainLoss.toFixed(2)}
                  </td>
                  <td className="px-6 py-3">—</td>
                  <td className="px-6 py-3">—</td>
                  <td className="px-6 py-3">—</td>
                </tr>

                {/* ✅ Individual Stock Rows */}
                {data.stocks.map((stock, i) => {
                  const percent = totalInvestment
                    ? ((stock.investment! / totalInvestment) * 100).toFixed(2)
                    : "0.00";
                  const color = stock.gainLoss! >= 0 ? "text-green-600" : "text-red-600";

                  return (
                    <tr key={i} className="hover:bg-gray-50 transition duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stock.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">₹{stock.purchasePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{stock.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">₹{stock.investment?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">₹{stock.cmp?.toFixed(2) || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">₹{stock.presentValue?.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${color}`}>₹{stock.gainLoss?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{percent}%</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{stock.peRatio || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{stock.latestEarnings || "—"}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
