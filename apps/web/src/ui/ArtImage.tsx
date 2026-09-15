import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface ArtImageProps {
  /** Primary source. */
  src: string;
  alt?: string;
  className?: string;
  title?: string;
  /** Tried once if the primary source fails to load. */
  fallbackSrc?: string;
  /** Rendered instead of an image when every source fails. */
  fallback?: ReactNode;
}

/**
 * Alpha art image with graceful degradation.
 *
 * Candidate raster art does not exist for every subject yet, so instead of a
 * browser broken-image glyph this tries an optional secondary source and then
 * an optional fallback node.
 */
export function ArtImage({
  src,
  alt = "",
  className,
  title,
  fallbackSrc,
  fallback,
}: ArtImageProps) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(src);
    setFailed(false);
  }, [src]);

  if (failed) return <>{fallback ?? null}</>;

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      title={title}
      draggable={false}
      onError={() => {
        if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc);
        else setFailed(true);
      }}
    />
  );
}
