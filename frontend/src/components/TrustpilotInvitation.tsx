'use client';
import { useEffect } from 'react';

/**
 * Trustpilot Invitation Script
 * This loads the invitation system that can send review invitations to customers
 *
 * Key: qJlpGYgKIn9uPxXR (from your Trustpilot dashboard)
 */

interface TrustpilotInvitationProps {
  integrationKey?: string;
}

// Extend window type for Trustpilot
declare global {
  interface Window {
    TrustpilotObject?: string;
    tp?: (...args: unknown[]) => void;
  }
}

export default function TrustpilotInvitation({
  integrationKey = process.env.NEXT_PUBLIC_TRUSTPILOT_INTEGRATION_KEY || 'qJlpGYgKIn9uPxXR',
}: TrustpilotInvitationProps) {
  useEffect(() => {
    if (!integrationKey) return;

    // Check if script already loaded
    if (window.tp) {
      window.tp('register', integrationKey);
      return;
    }

    // Load Trustpilot invitation script
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = 'https://invitejs.trustpilot.com/tp.min.js';

    script.onload = () => {
      if (window.tp) {
        window.tp('register', integrationKey);
      }
    };

    // Set TrustpilotObject before loading
    window.TrustpilotObject = 'tp';
    window.tp =
      window.tp ||
      function (...args: unknown[]) {
        ((window.tp as any).q = (window.tp as any).q || []).push(args);
      };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (optional)
    };
  }, [integrationKey]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Usage:
 *
 * 1. Add to your layout.tsx or _app.tsx:
 *    <TrustpilotInvitation />
 *
 * 2. After a successful transaction, call:
 *    window.tp('createInvitation', {
 *      recipientEmail: 'customer@example.com',
 *      recipientName: 'John Doe',
 *      referenceId: 'ORDER-123',
 *      source: 'InvitationScript'
 *    });
 */
