import { useNavigate } from "react-router-dom";

export default function Breadcrumbs({ current }) {
  const nav = useNavigate();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 my-4">
      <button
        onClick={() => nav("/app")}
        className="hover:text-blue-600 transition cursor-pointer"
      >
        Home
      </button>
      <span>/</span>
      <span className="font-semibold text-gray-900">{current}</span>
    </nav>
  );
}
