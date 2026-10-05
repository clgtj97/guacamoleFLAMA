import { Crow } from "../crow/crow";

// For React Router v6.4+ with file-based routing
export function meta() {
  return [
    { title: "LucKey" },
    { name: "description", content: "LUCK IS ON YOUR SIDE!" },
  ];
}

export default function Escrow() {
  return <Crow/>;
}

// Optional: Add loader if you need data loading
function loader() {
  // Your data loading logic here
  return null;
}