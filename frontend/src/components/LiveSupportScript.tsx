"use client";

import { useEffect } from "react";

const SMARTSUPP_KEY = process.env.NEXT_PUBLIC_SMARTSUPP_KEY;

export default function LiveSupportScript() {
  useEffect(() => {
    if (!SMARTSUPP_KEY) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (document.getElementById("smartsupp-script")) {
      return;
    }

    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = SMARTSUPP_KEY;

    const firstScript = document.getElementsByTagName("script")[0];
    const script = document.createElement("script");
    script.id = "smartsupp-script";
    script.type = "text/javascript";
    script.charset = "utf-8";
    script.async = true;
    script.src = "https://www.smartsuppchat.com/loader.js";

    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
