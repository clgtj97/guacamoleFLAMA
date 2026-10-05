import GameOne from "../gameOne/gameOne";

// For React Router v6.4+ with file-based routing
export function meta() {
  return [
    { title: "LucKey" },
    { name: "description", content: "EXPLORE YOUR LUCK IN THIS WOLRD!" },
  ];
}

export default function CreateRou() {
  return <GameOne />;
}

// Optional: Add loader if you need data loading
export function loader() {
  // Your data loading logic here
  return null;
}