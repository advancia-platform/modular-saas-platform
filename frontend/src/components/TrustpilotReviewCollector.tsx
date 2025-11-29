'use client';
import { useEffect } from 'react';

/**
 * Trustpilot Review Collector Widget
 * This widget encourages customers to leave reviews
 * Template ID: 56278e9abfbbba0bdcd568bc (Review Collector)
 */

interface TrustpilotReviewCollectorProps {
  className?: string;
}

export default function TrustpilotReviewCollector({
  className = '',
}: TrustpilotReviewCollectorProps) {
  useEffect(() => {
    // Load Trustpilot widget script if not already loaded
    const scriptId = 'trustpilot-widget-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Reload widgets when component mounts
    const loadWidget = () => {
      if (window.Trustpilot) {
        window.Trustpilot.loadFromElement(document.querySelector('.trustpilot-widget'), true);
      }
    };

    // Check if script is already loaded
    if (window.Trustpilot) {
      loadWidget();
    } else {
      // Wait for script to load
      const script = document.getElementById(scriptId);
      script?.addEventListener('load', loadWidget);
    }
  }, []);

  return (
    <div className={className}>
      {/* TrustBox widget - Review Collector */}
      <div
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="691c974952d3b92df9ac4f10"
        data-style-height="52px"
        data-style-width="100%"
        data-token="0a1a1bc2-aeb3-4831-9454-aa6ebdc215cb"
      >
        <a
          href="https://www.trustpilot.com/review/advanciapayledger.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
    </div>
  );
}

// Extend window for Trustpilot
declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: Element | null, useCache: boolean) => void;
    };
  }
}
