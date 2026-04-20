import { signIn } from "@/lib/auth";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="login-root">
      {/* Ambient background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Glass card */}
      <div className="glass-card">
        {/* Logo mark */}
        <div className="logo-wrap">
          <div className="logo-ring">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 3L24 8.5V19.5L14 25L4 19.5V8.5L14 3Z"
                stroke="#3B6EE8"
                strokeWidth="1.8"
                fill="none"
              />
              <path
                d="M14 8L19 10.75V16.25L14 19L9 16.25V10.75L14 8Z"
                fill="#3B6EE8"
                fillOpacity="0.18"
                stroke="#3B6EE8"
                strokeWidth="1.2"
              />
            </svg>
          </div>
        </div>

        {/* Heading group */}
        <div className="heading-group">
          <h1 className="heading">Sign in to continue</h1>
          <p className="subheading">
            Access to this form requires your company Microsoft&nbsp;365
            account. Please sign in below to submit your requisition.
          </p>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Auth form */}
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", {
              redirectTo: "/dashboard",
            });
          }}
        >
          <button type="submit" className="msft-btn">
            <MicrosoftIcon />
            <span>Sign in with Microsoft 365</span>
          </button>
        </form>

        {/* Footer note */}
        <Link href="/" className="footer-note underline">
          Back to HomePage
        </Link>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');

        .login-root {
          font-family: 'Geist', -apple-system, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #EEF2FA;
          position: relative;
          overflow: hidden;
          padding: 1rem;
        }

        /* Ambient colour orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(99,140,255,0.28) 0%, transparent 70%);
          top: -120px; left: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(160,110,255,0.18) 0%, transparent 70%);
          bottom: -80px; right: -80px;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(80,210,200,0.14) 0%, transparent 70%);
          top: 50%; left: 60%;
          transform: translate(-50%, -50%);
        }

        /* Glass card */
        .glass-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.85);
          box-shadow:
            0 2px 0 0 rgba(255,255,255,0.9) inset,
            0 -1px 0 0 rgba(180,190,220,0.25) inset,
            0 24px 48px rgba(60,80,160,0.10),
            0 8px 16px rgba(60,80,160,0.06);
          padding: 40px 36px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* Logo */
        .logo-wrap {
          margin-bottom: 24px;
        }
        .logo-ring {
          width: 60px; height: 60px;
          border-radius: 16px;
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(180,200,255,0.5);
          box-shadow:
            0 1px 0 0 rgba(255,255,255,0.95) inset,
            0 4px 12px rgba(59,110,232,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Heading */
        .heading-group {
          text-align: center;
          margin-bottom: 24px;
        }
        .heading {
          font-size: 22px;
          font-weight: 600;
          color: #1a2340;
          margin: 0 0 10px;
          letter-spacing: -0.3px;
          line-height: 1.25;
        }
        .subheading {
          font-size: 14px;
          font-weight: 400;
          color: #5a6480;
          margin: 0;
          line-height: 1.65;
        }

        /* Divider */
        .divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(160,175,220,0.35) 30%, rgba(160,175,220,0.35) 70%, transparent);
          margin-bottom: 24px;
        }

        /* Microsoft button */
        .msft-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          padding: 13px 20px;
          border-radius: 12px;
          border: 1px solid rgba(180,195,240,0.6);
          background: rgba(255,255,255,0.85);
          box-shadow:
            0 1px 0 0 rgba(255,255,255,0.95) inset,
            0 4px 14px rgba(59,110,232,0.10),
            0 1px 3px rgba(60,80,160,0.08);
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 500;
          color: #1a2340;
          cursor: pointer;
          transition: all 0.18s ease;
          letter-spacing: -0.1px;
          margin-bottom: 0;
        }
        .msft-btn:hover {
          background: rgba(255,255,255,0.98);
          border-color: rgba(100,140,255,0.45);
          box-shadow:
            0 1px 0 0 rgba(255,255,255,1) inset,
            0 6px 20px rgba(59,110,232,0.16),
            0 2px 6px rgba(60,80,160,0.10);
        }
        .msft-btn:active {
          transform: translateY(0px);
          box-shadow:
            0 1px 0 0 rgba(255,255,255,0.9) inset,
            0 2px 8px rgba(59,110,232,0.10);
        }

        /* Footer */
        .footer-note {
          margin-top: 20px;
          font-size: 12px;
          color: #8a95b0;
          text-align: center;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .glass-card { padding: 32px 24px 28px; }
          .heading { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
