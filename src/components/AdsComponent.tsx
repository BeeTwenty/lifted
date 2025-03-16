
import React, { useEffect } from 'react';

interface AdsComponentProps {
  dataAdSlot: string;
}

const AdsComponent = ({ dataAdSlot }: AdsComponentProps) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log(`Ad pushed to queue for slot: ${dataAdSlot}`);
    } catch (e) {
      console.error('Error pushing ad:', e);
    }
  }, [dataAdSlot]);

  return (
    <ins 
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-1703915401564574"
      data-ad-slot={dataAdSlot}
      data-ad-format="auto"
      data-full-width-responsive="true">
    </ins>
  );
};

export default AdsComponent;
