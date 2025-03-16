
// Type definitions for Google AdSense
interface Window {
  adsbygoogle: any[] | undefined;
}

// Extend HTMLElement to include data-ad-status attribute
interface HTMLElement {
  dataset: {
    adStatus?: string;
    [key: string]: string | undefined;
  };
}
