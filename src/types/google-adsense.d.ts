
// Type definitions for Google AdSense
interface Window {
  adsbygoogle: {
    push: (params: object) => void;
    [key: string]: any;
  }[] | undefined;
}

// Extend HTMLElement to include data-ad-status attribute
interface HTMLElement {
  dataset: {
    adStatus?: string;
    [key: string]: string | undefined;
  };
}
