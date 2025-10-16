import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const noFooter = location.pathname === "/app" || location.pathname === "/app/history";

  if (noFooter) return;

  if (!isLandingPage) {
    // Optional: render a simpler footer or nothing for /app
    return (
      <footer className="bg-gray-50 border-t border-gray-200 w-full mt-20">
        <div className="flex justify-center items-center w-full px-10 py-5 text-gray-600 text-xs sm:text-md">
          © {new Date().getFullYear()} DocUnpack. All rights reserved.
        </div>
      </footer>
    );
  }

  // Full footer for landing page
  return (
    <footer className="bg-gray-50 border-t border-gray-200 w-full">
      <div className="flex flex-col justify-center items-center w-full px-6 md:px-10 pt-12 pb-5">
        <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Logo + About */}
          <div className="flex flex-col md:w-3/4">
            <h2 className="text-2xl font-bold text-indigo-600">DocUnpack</h2>
            <p className="text-gray-600 mt-3">
              Simplify complex documentation with AI. Get clear, concise answers instantly.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:w-1/4">
            <h3 className="text-gray-900 font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-600">
              <li><a href="#features" className="hover:text-indigo-600">Features</a></li>
              <li><a href="#pricing" className="hover:text-indigo-600">Pricing</a></li>
              <li><a href="#how-it-works" className="hover:text-indigo-600">How it Works</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-400 mt-5 pt-6 flex flex-col md:flex-row items-center justify-around text-gray-600 w-full text-xs md:text-sm">
          <p>© {new Date().getFullYear()} DocUnpack. All rights reserved.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link to="/privacy" className="hover:text-indigo-600">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link to="/contact" className="hover:text-indigo-600">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
