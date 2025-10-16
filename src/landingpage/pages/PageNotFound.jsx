// src/landingpage/pages/NotFound.jsx
import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app');

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      {/* Big 404 */}
      <h1 className="text-8xl md:text-9xl font-extrabold text-indigo-600 mb-4 text-center">404</h1>

      {/* Message */}
      <p className="text-xl md:text-2xl mb-6 text-gray-700 text-center">
        Oops! The page you’re looking for doesn’t exist.
      </p>

      {/* Optional extra text */}
      <p className="text-gray-500 mb-8 max-w-md text-center">
        It might have been moved, deleted, or you may have typed the URL incorrectly.
      </p>

      {/* Button */}
      <a
        href={isApp ? "/app" : "/"}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition"
      >
        {isApp ? "Go to App" : "Go to Home"}
      </a>

      {/* Optional decorative image */}
      <div className="mt-12">
        <img
          src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
          alt="Not found illustration"
          className="w-80 md:w-96 mx-auto"
        />
      </div>
    </main>
  );
}
