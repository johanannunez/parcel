'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function BookingWidgetParamSync() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const iframe = document.getElementById('booking-iframe') as HTMLIFrameElement | null
    if (!iframe) return

    const entries = [
      ['checkin', searchParams.get('checkin')],
      ['checkout', searchParams.get('checkout')],
      ['adults', searchParams.get('adults')],
      ['children', searchParams.get('children')],
      ['infants', searchParams.get('infants')],
      ['pets', searchParams.get('pets')],
    ] as [string, string | null][]

    const hasAny = entries.some(([, v]) => v !== null)
    if (!hasAny) return

    const qs = entries
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&')

    const sep = iframe.src.includes('?') ? '&' : '?'
    iframe.src = `${iframe.src}${sep}${qs}`
  }, [searchParams])

  return null
}
