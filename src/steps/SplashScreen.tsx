// "YOUR RACE. / YOUR RULES. / YOUR PLAN." split into lines of words
const LINES = [
  ['YOUR', 'RACE.'],
  ['YOUR', 'RULES.'],
  ['YOUR', 'PLAN.'],
]
const WORDS = LINES.flat()
const STAGGER_MS = 60

function AnimatedHeadline() {
  let wordIndex = 0
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '64px',
        lineHeight: '1.05',
        color: 'var(--color-text)',
        letterSpacing: '-0.5px',
        maxWidth: '600px',
      }}
    >
      {LINES.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.map((word) => {
            const delay = wordIndex++ * STAGGER_MS
            return (
              <span
                key={word + delay}
                className="word-reveal"
                style={{ animationDelay: `${delay}ms`, marginRight: '0.25em' }}
              >
                {word}
              </span>
            )
          })}
        </span>
      ))}
    </p>
  )
}

// CTA appears after all words + subtext have animated in
const CTA_DELAY_MS = (WORDS.length + 1) * STAGGER_MS + 200

interface SplashScreenProps {
  onStart: () => void
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden"
      style={{ background: 'var(--color-canvas)' }}
    >
      {/* Logo */}
      <span
        className="absolute top-6 left-8"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '20px',
          color: 'var(--color-ember)',
          letterSpacing: '0.2em',
        }}
      >
        STRIDE
      </span>

      {/* Grain texture overlay */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </defs>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ filter: 'url(#grain)', opacity: 0.06 }}
      />

      {/* Radial ember glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(224,123,57,0.18) 0%, rgba(224,123,57,0.06) 45%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Runner silhouette icon */}
      <div className="relative mb-10">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Head */}
          <circle cx="48" cy="12" r="6" fill="var(--color-ember)" />
          {/* Torso + stride */}
          <path
            d="M48 18 L44 34 L34 44 L26 56
               M44 34 L50 46 L58 54
               M44 28 L36 22 L28 26
               M44 28 L54 24 L60 18"
            stroke="var(--color-ember)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Headline + subtext */}
      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        <AnimatedHeadline />

        <p
          className="word-reveal"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '17px',
            color: 'var(--color-muted)',
            maxWidth: '360px',
            animationDelay: `${WORDS.length * STAGGER_MS}ms`,
          }}
        >
          A personalised running plan built around you — your pace, your schedule, your goal.
        </p>

        <button
          onClick={onStart}
          className="word-reveal"
          style={{
            animationDelay: `${CTA_DELAY_MS}ms`,
            marginTop: '8px',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '16px',
            background: 'var(--color-ember)',
            color: 'var(--color-canvas)',
            border: 'none',
            borderRadius: '6px',
            padding: '14px 36px',
            cursor: 'pointer',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Build my plan →
        </button>
      </div>
    </div>
  )
}
