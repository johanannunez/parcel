const features = [
  {
    title: "Full Property Dashboard",
    desc: "Every unit, lease, and tenant visible at a glance from one command center.",
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    title: "Automated Task Management",
    desc: "Log repairs, assign priorities, and close tickets without chasing anyone down.",
    icon: (
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z" />
    ),
  },
  {
    title: "Owner Financial Reporting",
    desc: "Monthly statements and payout history generated automatically for every property.",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </>
    ),
  },
  {
    title: "Guest Intelligence, Powered by AI",
    desc: "Weekly AI summaries of guest feedback and owner action items, ready before you need them.",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </>
    ),
  },
];

const divider = "1px solid rgba(0,0,0,0.07)";

export function AuthFeatureRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", borderTop: divider }}>
      {features.map((f) => (
        <div
          key={f.title}
          style={{
            borderBottom: divider,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "12px 0",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                flexShrink: 0,
                marginTop: "2px",
                color: "var(--color-brand)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {f.icon}
              </svg>
            </div>
            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "2px",
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </strong>
              <span
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
