"use client";
import Image from "next/image";

interface AppImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function AppImage({
  src,
  alt,
  className,
  width = 500,
  height = 300,
}: AppImageProps) {
  return (
    <div className={`relative ${className || ""}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg shadow-md object-cover"
        priority
      />
    </div>
  );
}
