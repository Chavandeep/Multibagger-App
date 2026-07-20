// 50 large-cap NSE names spanning major sectors, used to drive the Top 50
// dashboard grid and the mock fundamentals engine. Prices/market caps are
// illustrative starting points for the mock data generator, not live
// figures — swapped for real Sharekhan quotes in Phase 2 (see README).

export interface Company {
  symbol: string
  name: string
  sector: string
  basePrice: number
  baseMarketCapCr: number // in Rs. Crores
}

export const COMPANIES: Company[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Oil & Gas', basePrice: 1462, baseMarketCapCr: 1978000 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', basePrice: 3612, baseMarketCapCr: 1308000 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', basePrice: 1742, baseMarketCapCr: 1334000 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', basePrice: 1268, baseMarketCapCr: 894000 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', basePrice: 1101, baseMarketCapCr: 456861 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', basePrice: 1892, baseMarketCapCr: 1128000 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', basePrice: 462, baseMarketCapCr: 578000 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', basePrice: 842, baseMarketCapCr: 751000 },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infra', basePrice: 3684, baseMarketCapCr: 507000 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', basePrice: 2412, baseMarketCapCr: 567000 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financial Services', basePrice: 7412, baseMarketCapCr: 458000 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', basePrice: 1892, baseMarketCapCr: 375000 },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', basePrice: 1142, baseMarketCapCr: 352000 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', basePrice: 12842, baseMarketCapCr: 388000 },
  { symbol: 'SUNPHARMA', name: "Sun Pharmaceutical", sector: 'Pharma', basePrice: 1782, baseMarketCapCr: 428000 },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer Durables', basePrice: 3642, baseMarketCapCr: 323000 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer Durables', basePrice: 2412, baseMarketCapCr: 231000 },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', basePrice: 2242, baseMarketCapCr: 216000 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', basePrice: 11842, baseMarketCapCr: 342000 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto', basePrice: 3142, baseMarketCapCr: 390000 },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power', basePrice: 372, baseMarketCapCr: 361000 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Power', basePrice: 312, baseMarketCapCr: 291000 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', basePrice: 782, baseMarketCapCr: 288000 },
  { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals', basePrice: 168, baseMarketCapCr: 211000 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals', basePrice: 1042, baseMarketCapCr: 254000 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Diversified', basePrice: 2542, baseMarketCapCr: 291000 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infra', basePrice: 1442, baseMarketCapCr: 312000 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', basePrice: 1782, baseMarketCapCr: 483000 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', basePrice: 312, baseMarketCapCr: 163000 },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', basePrice: 1642, baseMarketCapCr: 160000 },
  { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Cement', basePrice: 2812, baseMarketCapCr: 185000 },
  { symbol: 'COALINDIA', name: 'Coal India', sector: 'Mining', basePrice: 412, baseMarketCapCr: 254000 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Oil & Gas', basePrice: 242, baseMarketCapCr: 304000 },
  { symbol: 'IOC', name: 'Indian Oil Corporation', sector: 'Oil & Gas', basePrice: 178, baseMarketCapCr: 251000 },
  { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Oil & Gas', basePrice: 342, baseMarketCapCr: 148000 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Auto', basePrice: 9142, baseMarketCapCr: 255000 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Financial Services', basePrice: 1942, baseMarketCapCr: 310000 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Financial Services', basePrice: 742, baseMarketCapCr: 159000 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Financial Services', basePrice: 1712, baseMarketCapCr: 171000 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories", sector: 'Pharma', basePrice: 6142, baseMarketCapCr: 163000 },
  { symbol: 'DRREDDY', name: "Dr Reddy's Labs", sector: 'Pharma', basePrice: 1342, baseMarketCapCr: 112000 },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma', basePrice: 1642, baseMarketCapCr: 133000 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG', basePrice: 5942, baseMarketCapCr: 143000 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Auto', basePrice: 5342, baseMarketCapCr: 107000 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Auto', basePrice: 5842, baseMarketCapCr: 160000 },
  { symbol: 'SHREECEM', name: 'Shree Cement', sector: 'Cement', basePrice: 30142, baseMarketCapCr: 109000 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', basePrice: 7442, baseMarketCapCr: 107000 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG', basePrice: 1142, baseMarketCapCr: 109000 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Banking', basePrice: 842, baseMarketCapCr: 65000 },
  { symbol: 'TRENT', name: 'Trent Ltd', sector: 'Retail', basePrice: 5642, baseMarketCapCr: 200000 },
]
