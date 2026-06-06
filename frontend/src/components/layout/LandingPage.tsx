import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════
   HAND-CRAFTED SVG ICON COMPONENTS
   No AI-generated icons. Each path is manually authored.
   ═══════════════════════════════════════════════════════ */

const IconSignature = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20c2-1 4-3.5 5.5-6s2.5-5 3-6.5c.5-1.5.5-2 0-2s-1.5 1-3 3.5S5 15 4 17.5" />
    <path d="M9.5 14c1.5-2.5 3-4 4-4s1.5 1 0 3.5S10 19 9 20h12" />
  </svg>
);

const IconShield = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconDocument = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h6" />
  </svg>
);

const IconUsers = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M21 21v-1.5a3 3 0 0 0-2-2.83" />
  </svg>
);

const IconLock = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

const IconChart = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 16l4-5 4 3 5-6" />
  </svg>
);

const IconSend = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22 11 13 2 9 22 2z" />
  </svg>
);

const IconCheck = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const IconArrowRight = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IconHamburger = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const IconClose = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const IconGlobe = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconClock = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconFingerprint = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38-.16 4.42-.46 6.07" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.37" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .2-4-.01-5.78" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
    <path d="M6.73 21.15a6.02 6.02 0 0 1-.73-.64" />
    <path d="M6 12a6 6 0 0 1 .78-2.97" />
  </svg>
);

const IconBox = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </svg>
);

const IconStar = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconChevronDown = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);


/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════ */
function useCountUp(end: number, duration: number = 2000, trigger: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let startTime: number | null = null;
    let animationFrame: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) animationFrame = requestAnimationFrame(step);
    };
    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, trigger]);
  return count;
}


/* ═══════════════════════════════════════════════════════
   INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
   ═══════════════════════════════════════════════════════ */
function useInView(threshold = 0.15): [(el: HTMLDivElement | null) => void, boolean] {
  const [inView, setInView] = useState(false);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, threshold]);

  return [setElement, inView];
}


/* ═══════════════════════════════════════════════════════
   FAQ ACCORDION ITEM
   ═══════════════════════════════════════════════════════ */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="lp-faq-item"
      style={{ borderBottom: '1px solid var(--color-hairline-soft)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="lp-faq-button"
        aria-expanded={open}
      >
        <span className="lp-faq-question">{question}</span>
        <IconChevronDown
          className={`lp-faq-chevron ${open ? 'lp-faq-chevron-open' : ''}`}
        />
      </button>
      <div
        className="lp-faq-answer-wrapper"
        style={{
          maxHeight: open ? '500px' : '0px',
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 300ms ease-in-out, opacity 250ms ease-out',
        }}
      >
        <p className="lp-faq-answer">{answer}</p>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for navbar
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Stats animation
  const [statsRef, statsInView] = useInView(0.3);
  const stat1 = useCountUp(10000, 2000, statsInView);
  const stat2 = useCountUp(99, 1800, statsInView);
  const stat3 = useCountUp(150, 2200, statsInView);
  const stat4 = useCountUp(50, 1600, statsInView);

  // Section animations
  const [heroRef, heroInView] = useInView(0.05);
  const [featuresRef, featuresInView] = useInView();
  const [workflowRef, workflowInView] = useInView();
  const [securityRef, securityInView] = useInView();
  const [pricingRef, pricingInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const plans = [
    {
      name: 'Free',
      price: 0,
      description: 'For individuals signing occasional documents.',
      features: [
        '5 documents per month',
        'Draw, type, or upload signatures',
        'Single signer workflow',
        'SHA-256 document integrity',
        'Standard email notifications',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Pro',
      price: billingCycle === 'monthly' ? 15 : 12,
      description: 'For professionals managing regular signing workflows.',
      features: [
        '50 documents per month',
        'Advanced templates and custom fields',
        'Multi-signer sequential workflows',
        'Personal workspace and analytics',
        'Custom branding and styling',
        'Priority support',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Business',
      price: billingCycle === 'monthly' ? 45 : 36,
      description: 'For growing teams with collaborative workflows.',
      features: [
        '500 documents per month',
        'Shared team workspaces and templates',
        'Role-based access control (RBAC)',
        'Complete audit trails and timelines',
        'API access and integration readiness',
        'Dedicated success manager',
      ],
      cta: 'Go Business',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'Are electronic signatures legally binding?',
      answer:
        'Yes. SignFlow AI complies with the US ESIGN Act, UETA, and EU eIDAS regulations. Electronic signatures created through our platform carry the same legal weight as wet ink signatures in virtually all business contexts.',
    },
    {
      question: 'How does document integrity verification work?',
      answer:
        'Every signed document receives a unique SHA-256 cryptographic hash. Any modification to the PDF after signing will produce a different hash, immediately flagging the document as tampered. Our public verification endpoint allows anyone to validate a document\'s authenticity.',
    },
    {
      question: 'Can I use SignFlow AI on mobile devices?',
      answer:
        'Absolutely. The platform is fully responsive and touch-optimized. You can upload documents, place signature fields, draw signatures, and manage workflows from any modern mobile browser.',
    },
    {
      question: 'What happens when all signers complete their signatures?',
      answer:
        'Once the final signer completes their fields, SignFlow AI automatically finalizes the PDF, embeds all signatures permanently, generates a Certificate of Completion page, computes integrity checksums, and sends the completed document to all parties via email.',
    },
    {
      question: 'How do multi-signer workflows function?',
      answer:
        'You can configure sequential or parallel signing orders. In sequential mode, each signer receives their invitation only after the previous signer completes. In parallel mode, all signers are notified simultaneously and can sign in any order.',
    },
    {
      question: 'Is there a free tier available?',
      answer:
        'Yes. Our free tier includes 5 documents per month with full signature capabilities, SHA-256 hashing, audit trails, and email notifications. No credit card required.',
    },
  ];

  return (
    <div className="lp-root">
      {/* ─── NAVIGATION ─── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          {/* Logo */}
          <div className="lp-logo" onClick={() => navigate('/')}>
            <div className="lp-logo-mark">
              <IconSignature className="lp-logo-icon" />
            </div>
            <span className="lp-logo-text">SignFlow</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>

          {/* Desktop CTA */}
          <div className="lp-nav-actions">
            <button onClick={() => navigate('/login')} className="lp-btn-ghost-nav">
              Sign In
            </button>
            <button onClick={() => navigate('/register')} className="lp-btn-primary">
              Start Free Trial
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lp-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <IconClose className="lp-mobile-icon" />
            ) : (
              <IconHamburger className="lp-mobile-icon" />
            )}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lp-mobile-drawer">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)}>Security</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="lp-mobile-drawer-actions">
              <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="lp-btn-secondary lp-btn-full">
                Sign In
              </button>
              <button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} className="lp-btn-primary lp-btn-full">
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        className={`lp-hero lp-fade-section ${heroInView ? 'lp-visible' : ''}`}
      >
        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              Enterprise-Grade Security
            </div>

            <h1 className="lp-hero-title">
              The modern way to
              <br />
              <span className="lp-hero-title-accent">sign documents</span>
            </h1>

            <p className="lp-hero-subtitle">
              Upload PDFs, place digital signature fields, invite recipients, and generate
              legally traceable signed documents — with full cryptographic audit trails.
            </p>

            <div className="lp-hero-cta-row">
              <button onClick={() => navigate('/register')} className="lp-btn-ink">
                <span>Start Signing Free</span>
                <IconArrowRight className="lp-btn-arrow" />
              </button>
              <button onClick={() => navigate('/login')} className="lp-btn-secondary">
                Go to Dashboard
              </button>
            </div>

            <div className="lp-hero-trust-row">
              <div className="lp-hero-trust-item">
                <div className="lp-hero-stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IconStar key={i} className="lp-star" />
                  ))}
                </div>
                <span>4.9/5 from 2,000+ reviews</span>
              </div>
              <span className="lp-hero-trust-sep" />
              <span>SOC 2 Compliant</span>
              <span className="lp-hero-trust-sep" />
              <span>eIDAS Ready</span>
            </div>
          </div>

          {/* Hero Visual — Hand-crafted product mockup */}
          <div className="lp-hero-visual">
            <div className="lp-hero-card">
              {/* Window chrome */}
              <div className="lp-hero-card-chrome">
                <div className="lp-chrome-dots">
                  <span className="lp-chrome-dot lp-chrome-dot-r" />
                  <span className="lp-chrome-dot lp-chrome-dot-y" />
                  <span className="lp-chrome-dot lp-chrome-dot-g" />
                </div>
                <span className="lp-chrome-filename">Contract_Agreement.pdf</span>
              </div>

              {/* Document body */}
              <div className="lp-hero-card-body">
                <div className="lp-doc-line lp-doc-line-1" />
                <div className="lp-doc-line lp-doc-line-2" />
                <div className="lp-doc-line lp-doc-line-3" />
                <div className="lp-doc-line lp-doc-line-4" />

                {/* Signature field */}
                <div className="lp-doc-sig-field">
                  <IconSignature className="lp-doc-sig-icon" />
                  <span className="lp-doc-sig-label">Signature Field</span>
                  <div className="lp-doc-sig-badge">Signer 1</div>
                </div>

                <div className="lp-doc-line lp-doc-line-5" />
                <div className="lp-doc-line lp-doc-line-6" />
              </div>

              {/* Status bar */}
              <div className="lp-hero-card-status">
                <div className="lp-status-left">
                  <IconShield className="lp-status-icon" />
                  <div>
                    <div className="lp-status-title">SHA-256 Verified</div>
                    <div className="lp-status-hash">a8f9c1b3...d2e9e4f0</div>
                  </div>
                </div>
                <span className="lp-status-badge">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section ref={statsRef} className="lp-stats">
        <div className="lp-stats-inner">
          <div className="lp-stat">
            <div className="lp-stat-number">{stat1.toLocaleString()}+</div>
            <div className="lp-stat-label">Documents Signed</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-number">{stat2}.9%</div>
            <div className="lp-stat-label">Uptime SLA</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-number">{stat3}+</div>
            <div className="lp-stat-label">Countries Served</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-number">{stat4}M+</div>
            <div className="lp-stat-label">Audit Events Tracked</div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section
        id="features"
        ref={featuresRef}
        className={`lp-section lp-fade-section ${featuresInView ? 'lp-visible' : ''}`}
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Everything you need to sign with confidence</h2>
            <p className="lp-section-subtitle">
              A complete digital signature ecosystem designed for security, speed, and compliance.
            </p>
          </div>

          <div className="lp-features-grid">
            {[
              {
                icon: <IconSignature className="lp-feature-icon-svg" />,
                title: 'Professional Signing Canvas',
                desc: 'Draw smooth signatures, type in multiple decorative cursive fonts, or upload your handwritten image. Customize ink colors and field styling.',
              },
              {
                icon: <IconShield className="lp-feature-icon-svg" />,
                title: 'Tamper-Proof Audit Trail',
                desc: 'Every action is recorded — signer IP, browser, timestamp, and device. Cryptographic Certificate of Completion appended to every finalized document.',
              },
              {
                icon: <IconSend className="lp-feature-icon-svg" />,
                title: 'Public Signing Links',
                desc: 'Generate password-protected, one-time-use, or expiring share links. Recipients can sign without creating an account.',
              },
              {
                icon: <IconUsers className="lp-feature-icon-svg" />,
                title: 'Multi-Signer Workflows',
                desc: 'Coordinate complex signing sequences. Route documents sequentially or in parallel with automatic notifications to each signer.',
              },
              {
                icon: <IconChart className="lp-feature-icon-svg" />,
                title: 'Team Workspaces',
                desc: 'Organize teams into shared workspaces with role-based access control. Collaborate on templates and manage documents collectively.',
              },
              {
                icon: <IconFingerprint className="lp-feature-icon-svg" />,
                title: 'Identity Verification',
                desc: 'Capture comprehensive signer identity — IP address, browser fingerprint, operating system, and geographic location for every signature event.',
              },
            ].map((feature, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon-wrap">{feature.icon}</div>
                <h3 className="lp-feature-title">{feature.title}</h3>
                <p className="lp-feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="how-it-works"
        ref={workflowRef}
        className={`lp-section lp-section-soft lp-fade-section ${workflowInView ? 'lp-visible' : ''}`}
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Three steps to a signed document</h2>
            <p className="lp-section-subtitle">
              From upload to legal signature in minutes, not days.
            </p>
          </div>

          <div className="lp-workflow-grid">
            {[
              {
                step: '01',
                icon: <IconDocument className="lp-workflow-icon-svg" />,
                title: 'Upload and prepare',
                desc: 'Import any PDF. Drag and drop signature, text, date, and checkbox fields onto specific pages with precision placement.',
              },
              {
                step: '02',
                icon: <IconSend className="lp-workflow-icon-svg" />,
                title: 'Invite recipients',
                desc: 'Define signing order — sequential or parallel. Add signer details and send customized invitations via email or share link.',
              },
              {
                step: '03',
                icon: <IconShield className="lp-workflow-icon-svg" />,
                title: 'Sign and verify',
                desc: 'Once all signatures are captured, the system finalizes the PDF, appends a Certificate of Completion, and generates SHA-256 integrity proof.',
              },
            ].map((item, i) => (
              <div key={i} className="lp-workflow-card">
                <div className="lp-workflow-step">{item.step}</div>
                <div className="lp-workflow-icon-wrap">{item.icon}</div>
                <h3 className="lp-workflow-title">{item.title}</h3>
                <p className="lp-workflow-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section
        id="security"
        ref={securityRef}
        className={`lp-section lp-fade-section ${securityInView ? 'lp-visible' : ''}`}
      >
        <div className="lp-container">
          <div className="lp-security-banner">
            <div className="lp-security-content">
              <div className="lp-security-icon-wrap">
                <IconGlobe className="lp-security-icon-svg" />
              </div>
              <h2 className="lp-security-title">Legally traceable and globally compliant</h2>
              <p className="lp-security-desc">
                SignFlow AI complies with the US Electronic Signatures in Global and National
                Commerce Act (ESIGN), the Uniform Electronic Transactions Act (UETA), and EU
                eIDAS regulations. Every signature is backed by tamper-evident cryptographic proof.
              </p>
              <div className="lp-compliance-badges">
                <span className="lp-compliance-badge">ESIGN Act</span>
                <span className="lp-compliance-badge">UETA</span>
                <span className="lp-compliance-badge">eIDAS</span>
                <span className="lp-compliance-badge">HIPAA Ready</span>
              </div>
            </div>

            <div className="lp-security-metrics">
              {[
                { label: 'AES Encryption', value: '256-bit' },
                { label: 'Secure Transfer', value: 'SSL/TLS' },
                { label: 'Crypto Hashing', value: 'SHA-256' },
                { label: 'Data Compliance', value: 'SOC 2' },
              ].map((m, i) => (
                <div key={i} className="lp-security-metric-card">
                  <div className="lp-metric-value">{m.value}</div>
                  <div className="lp-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY SIGNFLOW FEATURE ROW ─── */}
      <section className="lp-section lp-section-soft">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Why choose SignFlow</h2>
          </div>
          <div className="lp-why-grid">
            {[
              { icon: <IconClock className="lp-why-icon-svg" />, title: 'Sign in minutes', desc: 'No printing, scanning, or mailing. Complete your signing workflow in under 5 minutes.' },
              { icon: <IconLock className="lp-why-icon-svg" />, title: 'Bank-grade security', desc: '256-bit AES encryption, SHA-256 hashing, and full audit trails for every document action.' },
              { icon: <IconBox className="lp-why-icon-svg" />, title: 'Free to start', desc: 'No credit card required. Get 5 free documents per month with full signing capabilities.' },
              { icon: <IconGlobe className="lp-why-icon-svg" />, title: 'Works everywhere', desc: 'Responsive design that works seamlessly on desktop, tablet, and mobile browsers.' },
            ].map((item, i) => (
              <div key={i} className="lp-why-card">
                <div className="lp-why-icon-wrap">{item.icon}</div>
                <h3 className="lp-why-title">{item.title}</h3>
                <p className="lp-why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section
        id="pricing"
        ref={pricingRef}
        className={`lp-section lp-fade-section ${pricingInView ? 'lp-visible' : ''}`}
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Simple, transparent pricing</h2>
            <p className="lp-section-subtitle">
              Start free. Scale as your document volume grows.
            </p>

            {/* Billing toggle */}
            <div className="lp-billing-toggle">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`lp-billing-pill ${billingCycle === 'monthly' ? 'lp-billing-pill-active' : ''}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`lp-billing-pill ${billingCycle === 'yearly' ? 'lp-billing-pill-active' : ''}`}
              >
                Yearly
                <span className="lp-billing-save">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="lp-pricing-grid">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`lp-pricing-card ${plan.popular ? 'lp-pricing-card-popular' : ''}`}
              >
                {plan.popular && (
                  <div className="lp-pricing-popular-badge">Most Popular</div>
                )}
                <div className="lp-pricing-header">
                  <h3 className="lp-pricing-name">{plan.name}</h3>
                  <p className="lp-pricing-desc">{plan.description}</p>
                </div>
                <div className="lp-pricing-price-row">
                  <span className="lp-pricing-currency">$</span>
                  <span className="lp-pricing-amount">{plan.price}</span>
                  <span className="lp-pricing-period">/ month</span>
                </div>
                <hr className="lp-pricing-divider" />
                <ul className="lp-pricing-features">
                  {plan.features.map((f) => (
                    <li key={f} className="lp-pricing-feature">
                      <IconCheck className="lp-pricing-check" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={plan.popular ? 'lp-btn-buy' : 'lp-btn-secondary lp-btn-full'}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section
        id="faq"
        ref={faqRef}
        className={`lp-section lp-section-soft lp-fade-section ${faqInView ? 'lp-visible' : ''}`}
      >
        <div className="lp-container lp-faq-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Frequently asked questions</h2>
          </div>
          <div className="lp-faq-list">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA BANNER ─── */}
      <section
        ref={ctaRef}
        className={`lp-section lp-fade-section ${ctaInView ? 'lp-visible' : ''}`}
      >
        <div className="lp-container">
          <div className="lp-cta-banner">
            <h2 className="lp-cta-title">Ready to transform how you sign?</h2>
            <p className="lp-cta-desc">
              Join thousands of professionals who trust SignFlow AI for secure,
              legally binding electronic signatures.
            </p>
            <div className="lp-cta-actions">
              <button onClick={() => navigate('/register')} className="lp-btn-cta-primary">
                <span>Create Free Account</span>
                <IconArrowRight className="lp-btn-arrow" />
              </button>
              <button onClick={() => navigate('/login')} className="lp-btn-cta-secondary">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="lp-logo-mark">
                  <IconSignature className="lp-logo-icon" />
                </div>
                <span className="lp-logo-text">SignFlow</span>
              </div>
              <p className="lp-footer-tagline">
                Enterprise-grade digital signatures with cryptographic audit trails,
                multi-signer workflows, and instant compliance.
              </p>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#security">Security</a>
              <a href="#how-it-works">How It Works</a>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">Legal</h4>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#compliance">Compliance Guide</a>
              <a href="#dpa">Data Processing</a>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">Company</h4>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#careers">Careers</a>
              <a href="#blog">Blog</a>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>&copy; {new Date().getFullYear()} SignFlow AI. All rights reserved.</span>
            <div className="lp-footer-socials">
              <a href="#twitter" aria-label="Twitter">
                <svg className="lp-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn">
                <svg className="lp-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#github" aria-label="GitHub">
                <svg className="lp-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
