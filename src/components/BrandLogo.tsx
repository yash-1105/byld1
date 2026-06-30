interface BrandLogoProps {
  /** true → dark sage logo for light backgrounds (default); false → white logo for dark backgrounds */
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// byld/space lockup — aspect ratio ≈ 637:200
const HEIGHTS = {
  sm: 'h-5',
  md: 'h-7',
  lg: 'h-9',
  xl: 'h-11',
};

export default function BrandLogo({ dark = true, size = 'md', className = '' }: BrandLogoProps) {
  return (
    <img
      src="/images/byld-lockup.png"
      alt="BYLD / SPACE"
      className={`${HEIGHTS[size]} w-auto select-none object-contain ${
        dark ? '' : '[filter:brightness(0)_invert(1)]'
      } ${className}`}
      draggable={false}
    />
  );
}
