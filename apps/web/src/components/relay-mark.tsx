export default function RelayMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const w = size;
  const h = (size * 28) / 64;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 64 28"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M 2 4 L 18 4 L 30 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 2 24 L 18 24 L 30 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 30 14 L 50 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M 46 8 L 52 14 L 46 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 8 14 L 48 14"
        stroke="#7CFF00"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="58" cy="14" r="2.4" fill="#7CFF00" />
    </svg>
  );
}
