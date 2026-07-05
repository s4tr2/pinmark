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
          d="M13.5 4.5C8.25 4.5 4 8.75 4 14s4.25 9.5 9.5 9.5H23V14c0-5.25-4.25-9.5-9.5-9.5Z"
        />
        <g className="brand-cross">
          <path
            className="brand-cross-line brand-cross-line-horizontal"
            d="M17 23H29"
          />
          <path
            className="brand-cross-line brand-cross-line-vertical"
            d="M23 17V29"
          />
        </g>
      </svg>
      <span>{name}</span>
    </Link>
  );
}
