import Link from 'next/link';

export default function BiteBestLogo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="BiteBest home">
      <svg
        width="38"
        height="38"
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="19" cy="19" r="16" fill="#F5F1E8" stroke="#243119" strokeWidth="2" />
        <circle cx="19" cy="19" r="11.5" stroke="#556B2F" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.58" />
        <path d="M19 5.5V8.6M32.5 19H29.4M19 32.5V29.4M5.5 19H8.6" stroke="#556B2F" strokeWidth="1.4" strokeLinecap="round" />
        <text
          x="19"
          y="23"
          textAnchor="middle"
          fontSize="11"
          fontFamily="Arial, sans-serif"
          fontWeight="700"
          fill="#243119"
          opacity="0.18"
        >
          {'\u20b9'}
        </text>
        <g
          className="origin-center transition-transform duration-300 ease-out group-hover:rotate-[5deg]"
          style={{ transformBox: 'fill-box' }}
        >
          <path d="M15.2 22.8L25.8 12.2" stroke="#243119" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24.3 10.7L27.2 13.6" stroke="#243119" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M25.6 9.4L28.5 12.3" stroke="#243119" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M14 24L12.1 25.9" stroke="#556B2F" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <circle cx="19" cy="19" r="2.1" fill="#556B2F" />
      </svg>
      <span className="text-xl font-semibold tracking-tight">
        <span className="text-[#243119]">Bite</span>
        <span className="text-[#556B2F]">Best</span>
      </span>
    </Link>
  );
}
