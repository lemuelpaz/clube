'use client'

interface Props {
  src?: string
  alt: string
  viewerId: string
  className?: string
  fallback?: React.ReactNode
}

export default function WatermarkedPhoto({ src, alt, viewerId, className = '', fallback }: Props) {
  const tag = `clubeelite.com • ${viewerId.slice(-8)}`

  function noCtx(e: React.MouseEvent) { e.preventDefault() }

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
          onContextMenu={noCtx}
        />
      ) : (
        fallback ?? (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-dark-500">
            {alt[0]?.toUpperCase()}
          </div>
        )
      )}

      {/* Watermark grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[0, 1, 2, 3, 4].map(row =>
          [0, 1, 2].map(col => (
            <span
              key={`${row}-${col}`}
              className="absolute text-[10px] font-semibold tracking-widest whitespace-nowrap"
              style={{
                top: `${row * 22 + 4}%`,
                left: `${col * 36 - 4}%`,
                transform: 'rotate(-32deg)',
                color: 'rgba(201,168,76,0.22)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {tag}
            </span>
          ))
        )}
        <span
          className="absolute bottom-2 right-3 text-[9px] font-bold"
          style={{ color: 'rgba(201,168,76,0.4)' }}
        >
          Clube Elite
        </span>
      </div>
    </div>
  )
}
