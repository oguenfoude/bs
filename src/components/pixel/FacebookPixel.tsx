/**
 * Facebook Meta Pixel Component
 * 
 * PURPOSE: Tracks user interactions for Facebook advertising and analytics.
 * 
 * EVENTS TRACKED:
 * - PageView: When page loads
 * - AddToCart: When user selects a watch
 * - Purchase: When order is successfully submitted
 * 
 * PIXEL ID: 1301109644932375
 */

"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

/**
 * Track Facebook Pixel event safely.
 * Purchase events require currency parameter.
 */
export function trackFbEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      const sanitizedParams = params ? { ...params } : {};
      
      // Purchase events require currency - use USD since DZD is not supported
      if (event === "Purchase" && !sanitizedParams.currency) {
        sanitizedParams.currency = "USD";
      }
      
      // Remove currency from other events if it's DZD (not supported)
      if (sanitizedParams.currency === "DZD" && event !== "Purchase") {
        delete sanitizedParams.currency;
      }
      
      window.fbq("track", event, sanitizedParams);
      console.log(`📊 Facebook Pixel: ${event}`, sanitizedParams);
    } catch (error) {
      console.warn("Facebook Pixel tracking error:", error);
    }
  }
}

/**
 * Facebook Pixel initialization component.
 */
export default function FacebookPixel() {
  const PIXEL_ID = "1301109644932375";

  useEffect(() => {
    // Track initial page view
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, []);

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
