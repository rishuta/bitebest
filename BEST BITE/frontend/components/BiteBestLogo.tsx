import Link from 'next/link';

export default function BiteBestLogo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="BiteBest home">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="40" height="40" rx="10" fill="#3F4F20" />
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize="18"
          fill="#E8DFC3"
        >
          BB
        </text>
      </svg>
      <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <span className="text-[#3F4F20]">Bite</span>
        <span className="text-[#7F9135]">Best</span>
      </span>
    </Link>
  );
}
