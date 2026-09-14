import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL2 || "http://localhost:3001";
const REFRESH_INTERVAL = 10000;

export default function Footer() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    const recordPageView = async () => {
      try {
        const response = await fetch(`${API_URL}/api/pageviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url:
              window.location.origin +
              window.location.pathname +
              window.location.search,
            referrer: document.referrer || null,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setVisitorCount(data.count);
        }
      } catch (error) {
        console.error("Failed to record page view:", error);
      }
    };

    const refreshPageViews = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/pageviews?url=${encodeURIComponent(
            window.location.origin +
            window.location.pathname +
            window.location.search
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (data.success) {
          setVisitorCount(data.count);
        }
      } catch (error) {
        console.error("Failed to refresh page views:", error);
      }
    };

    // Record this page view once.
    recordPageView();

    // Refresh the displayed count every 10 seconds.
    const interval = setInterval(
      refreshPageViews,
      REFRESH_INTERVAL
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-line bg-white py-6">
      <div className="flex flex-col items-center justify-center gap-1 text-center sm:flex-row">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://tubbylab.com"
            rel="noopener noreferrer"
            className="foot-link"
          >
            Cromuel
          </a>{" "}
          🍆. All rights reserved.
        </p>

        {visitorCount !== null && (
          <div
            title="Total Page Views"
            className="inline-flex items-center gap-1 text-xs text-muted"
          >
            👀{" "}
            <strong className="font-semibold">
              {visitorCount.toLocaleString()}
            </strong>
          </div>
        )}
      </div>
    </footer>
  );
}

