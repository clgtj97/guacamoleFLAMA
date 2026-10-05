import { Table } from "../crow/table";

// For React Router v6.4+ with file-based routing
export function meta() {
  return [
    { title: "LucKey" },
    { name: "description", content: "LUCK IS ON YOUR SIDE!" },
  ];
}

export default function TransRou() {
  return <Table />;
}

// Optional: Add loader if you need data loading
export function loader() {
  // Your data loading logic here
  return null;
}