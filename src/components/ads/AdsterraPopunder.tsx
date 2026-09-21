'use client';

import { useEffect } from 'react';

/**
 * AdsterraPopunder - fires a popunder on the first profile visit per session.
 * Popunders are the highest-earning Adsterra format (~-3 CPM vs .10-0.30 for banners).
 * Limited to once per session to avoid annoying repeat visitors.
 */
export default function AdsterraPopunder() {
  useEffect(() => {
    // Only fire once per browser session
    if (typeof window === 'undefined') return;
    const key = 'pvstory_popunder_fired';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    // Dynamically inject the Adsterra popunder script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = [
      "var _Adsterra_Native_= _Adsterra_Native_ || {};",
      "_Adsterra_Native_.ads_track='0';",
    ].join('');
    document.body.appendChild(script);

    // Inject the actual popunder loader
    const loader = document.createElement('script');
    loader.type = 'text/javascript';
    loader.async = true;
    loader.setAttribute('data-cfasync', 'false');
    loader.src = '//pl4629628.profitableratecpmnetwork.com/invoke.js';
    document.body.appendChild(loader);

    return () => {
      // Cleanup on unmount (not strictly needed for popunders)
    };
  }, []);

  return null; // renders nothing visible
}
