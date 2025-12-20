"use client";
import React from 'react';

type Props = {
  size?: number;
  overlay?: boolean;
  ariaLabel?: string;
};

export default function Loader({ size = 48, overlay = true, ariaLabel = 'Loading' }: Props) {
  const style = { width: `${size}px`, height: `${size}px` };

  if (overlay) {
    return (
      <div aria-hidden="false" aria-label={ariaLabel} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <span className="loader" style={style} />
      </div>
    );
  }

  return <span className="loader" style={style} aria-label={ariaLabel} />;
}
