import Link from "next/link";

export function PinmarkLogo({ name }: { name: string }) {
  return (
    <Link className="brand-lockup" href="/" aria-label={`${name} home`}>
      <svg
        className="brand-mark"
        viewBox="0 0 32 32"
        width="20"
        height="20"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="brand-pin"
          d="M16 27C16 27 24 18.3 24 12A8 8 0 1 0 8 12C8 18.3 16 27 16 27Z"
        />
        <g className="brand-cross">
          <path
            className="brand-cross-line brand-cross-line-vertical"
            d="M16 8.5V15.5"
          />
          <path
            className="brand-cross-line brand-cross-line-horizontal"
            d="M12.5 12H19.5"
          />
        </g>
      </svg>
      <span>{name}</span>
    </Link>
  );
}
