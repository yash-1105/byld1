interface BrandLogoProps {
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: { main: 'text-base',  slash: 'text-sm',  sub: 'text-[9px]'  },
  md: { main: 'text-xl',    slash: 'text-base', sub: 'text-[11px]' },
  lg: { main: 'text-2xl',   slash: 'text-xl',   sub: 'text-xs'     },
  xl: { main: 'text-3xl',   slash: 'text-2xl',  sub: 'text-sm'     },
};

export default function BrandLogo({ dark = true, size = 'md', className = '' }: BrandLogoProps) {
  const s = SIZES[size];
  const mainColor  = dark ? 'text-foreground'       : 'text-white';
  const mutedColor = dark ? 'text-muted-foreground' : 'text-white/60';

  return (
    <div className={`flex items-baseline gap-0.5 select-none ${className}`}>
      <span className={`${s.main} font-bold tracking-tight ${mainColor}`}>BYLD</span>
      <span className={`${s.slash} font-light ${mutedColor} mx-0.5`}>/</span>
      <span className={`${s.sub} font-semibold tracking-[0.18em] uppercase ${mutedColor}`}>SPACE</span>
    </div>
  );
}
