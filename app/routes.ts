import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"), // Your welcome page
  route("escrow", "routes/escrow.tsx"), // Escrow route
  route("runes", "routes/runesRou.tsx"), // runes route
  route("mint", "routes/mintRou.tsx"), // mint route
  route("createCrow", "routes/createRou.tsx"),
  route("transactions", "routes/transRou.tsx"),
  route("invoice", "routes/invoiceRou.tsx"),
  route("help", "routes/helpRou.tsx"),
  route("games", "routes/gameRou.tsx")
  // Add more routes as needed
] satisfies RouteConfig;