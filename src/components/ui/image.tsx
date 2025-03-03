
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, fallback, alt = "", ...props }, ref) => {
    const [error, setError] = React.useState(false);

    if (error && fallback) {
      return <>{fallback}</>;
    }

    return (
      <img
        ref={ref}
        alt={alt}
        onError={() => setError(true)}
        className={cn("object-cover", className)}
        {...props}
      />
    );
  }
);

Image.displayName = "Image";

export default Image;
