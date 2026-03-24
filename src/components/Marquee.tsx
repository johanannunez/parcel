"use client"

import { useRef, useEffect, useState, useCallback, useId } from "react"

interface MarqueeProps {
  children: React.ReactNode
  speed?: number
  direction?: "left" | "right"
  pauseOnHover?: boolean
  fadeEdges?: boolean
  fadeWidth?: number
  gap?: number
}

export default function Marquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = true,
  fadeEdges = true,
  fadeWidth = 80,
  gap = 48,
}: MarqueeProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [animDuration, setAnimDuration] = useState(30)
  const animId = `marquee${useId().replace(/:/g, "")}`

  const measure = useCallback(() => {
    if (!stripRef.current) return
    const kids = stripRef.current.children
    if (kids.length === 0) return

    let totalWidth = 0
    const half = Math.floor(kids.length / 2)
    for (let i = 0; i < half; i++) {
      totalWidth += (kids[i] as HTMLElement).offsetWidth + gap
    }

    if (totalWidth > 0 && speed > 0) {
      setAnimDuration(totalWidth / speed)
    }
  }, [speed, gap])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      measure()
    })
    const resizeObserver = new ResizeObserver(measure)
    if (stripRef.current) {
      resizeObserver.observe(stripRef.current)
    }
    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
    }
  }, [measure])

  const fadeMask = fadeEdges
    ? `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`
    : undefined

  const translateFrom = direction === "left" ? "0" : "-50%"
  const translateTo = direction === "left" ? "-50%" : "0"

  return (
    <div
      className={pauseOnHover ? `${animId}-hover` : undefined}
      style={{
        overflow: "hidden",
        maskImage: fadeMask,
        WebkitMaskImage: fadeMask,
      }}
    >
      <div
        ref={stripRef}
        className={`${animId}-strip`}
        style={{
          display: "flex",
          width: "max-content",
          gap: `${gap}px`,
          animation: `${animId} ${animDuration}s linear infinite`,
        }}
      >
        {children}
        {children}
      </div>

      <style>{`
        @keyframes ${animId} {
          from { transform: translateX(${translateFrom}); }
          to { transform: translateX(${translateTo}); }
        }
        .${animId}-hover:hover .${animId}-strip {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
