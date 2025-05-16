const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const yahooFinance = require("yahoo-finance2").default;
const axios = require("axios");
const cheerio = require("cheerio");


app.get("/api/stock/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const quote = await yahooFinance.quote(symbol);

    const googleData = await scrapeGoogleFinance(symbol);

    res.json({
      symbol,
      cmp: quote.regularMarketPrice,
      peRatio: googleData.peRatio || quote.trailingPE,
      latestEarnings: googleData.latestEarnings || (quote.earningsTimestamp ? new Date(quote.earningsTimestamp * 1000).toLocaleDateString() : "N/A")
    });
  } catch (error) {
    console.error("error fetching stock data: ", error);
    res.status(500).json({ error: "Failed to fetch stock data" });

  }
});


async function scrapeGoogleFinance(symbol) {
  try {
    const url = `https://www.google.com/finance/quote/${symbol}:NSE`; // or use BSE, or adapt for NSE/BSE dynamically
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" } // mimic browser user agent
    });

    const $ = cheerio.load(data);

    // Sample selectors — inspect the actual Google Finance page to confirm these selectors
    const peRatio = $("div[data-field='PE_RATIO']").text() || null;
    const latestEarnings = $("div[data-field='LATEST_EARNINGS']").text() || null;

    // Alternative scraping — based on page structure, may need to adjust
    // e.g., peRatio = $('div:contains("P/E Ratio")').next().text();

    return {
      peRatio,
      latestEarnings
    };
  } catch (error) {
    console.error("Google Finance scrape error:", error.message);
    return {
      peRatio: null,
      latestEarnings: null
    };
  }
}


const PORT =process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Backend running on http://localhost:5000");
});
