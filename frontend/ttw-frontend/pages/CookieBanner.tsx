import React, { useEffect, useState } from "react";

const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("ttw_cookie_consent");
      if (consent !== "accepted" && consent !== "rejected") {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("ttw_cookie_consent", "accepted");
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem("ttw_cookie_consent", "rejected");
    window.location.reload();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white rounded-t-md shadow-sm flex justify-center px-4 py-3 z-50">
      <div className="max-w-4xl w-full flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="max-w-xl text-gray-900">
          <h2 className="text-base font-semibold mb-1">Cookies</h2>
          <p className="text-xs leading-relaxed">
            We use essential cookies to ensure the site works properly and non‑essential cookies (such as analytics) to improve your experience.
          </p>
          <a
            href="/cookies"
            className="inline-block mt-1 text-xs text-blue-700 underline hover:text-blue-800"
          >
            Cookie Policy
          </a>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAccept}
            className="bg-[#132b5b] text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#0f2448] transition"
          >
            Accept all cookies
          </button>
          <button
            onClick={handleReject}
            className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-100 transition"
          >
            Reject non‑essential
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
