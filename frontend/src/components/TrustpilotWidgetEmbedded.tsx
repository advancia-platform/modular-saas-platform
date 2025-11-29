'use client';
import { useEffect } from 'react';

type WidgetTemplate =
  | 'mini' // Mini star rating
  | 'micro' // Micro review count
  | 'carousel' // Review carousel
  | 'list' // Review list
  | 'grid' // Review grid
  | 'quote' // Single quote
  | 'custom';

type Props = {
  businessUnitId?: string;
  locale?: string;
  theme?: 'light' | 'dark';
  template?: WidgetTemplate;
  customTemplateId?: string;
  height?: number | string;
  width?: number | string;
  stars?: string; // Filter by stars, e.g., "5" (recommended)
  tags?: string; // Filter by tags
};

// Trustpilot Widget Template IDs
const TEMPLATE_IDS: Record<WidgetTemplate, string> = {
  mini: '5419b6a8b0d04a076446a9ad', // Mini star widget
  micro: '5419b6ffb0d04a076446a9b6', // Micro review count
  carousel: '53aa8912dec7e10d38f59f36', // Carousel
  list: '539ad60defb9600b94d7df2c', // List
  grid: '539adbd6dec7e10e686debee', // Grid
  quote: '0bff66558872c58ed5b8b7942acc34d9', // Single quote widget
  custom: '74ecde4d46d4b399c7295cf599d2886b', // Custom template
};

export default function TrustpilotWidgetEmbedded({
  businessUnitId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID ||
    '691c974952d3b92df9ac4f10',
  locale = 'en-US',
  theme = 'light',
  template = 'mini',
  customTemplateId,
  height = 'auto',
  width = '100%',
  stars,
  tags,
}: Props) {
  useEffect(() => {
    if (!businessUnitId) return;

    const scriptId = 'trustpilot-widget-script';

    // Check if script already exists
    if (document.getElementById(scriptId)) {
      // Reload widgets if script exists
      if ((window as any).Trustpilot) {
        (window as any).Trustpilot.loadFromElement(document.body, true);
      }
      return;
    }

    // Create and load Trustpilot script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';

    script.onload = () => {
      if ((window as any).Trustpilot) {
        (window as any).Trustpilot.loadFromElement(document.body, true);
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [businessUnitId]);

  if (!businessUnitId) {
    console.warn('Trustpilot: businessUnitId is required');
    return null;
  }

  const templateId = customTemplateId || TEMPLATE_IDS[template];

  return (
    <div
      className="trustpilot-widget"
      data-locale={locale}
      data-template-id={templateId}
      data-businessunit-id={businessUnitId}
      data-style-height={String(height)}
      data-style-width={String(width)}
      data-theme={theme}
      {...(stars && { 'data-stars': stars })}
      {...(tags && { 'data-tags': tags })}
    >
      <a
        href={`https://www.trustpilot.com/review/${
          process.env.NEXT_PUBLIC_TRUSTPILOT_DOMAIN || 'your-domain.com'
        }`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-purple-400 transition-colors"
      >
        Trustpilot
      </a>
    </div>
  );
}
