import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LucKey" },
    { name: "description", content: "LUCK IS ON YOUR SIDE!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
