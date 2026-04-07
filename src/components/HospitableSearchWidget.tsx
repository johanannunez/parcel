'use client'

import React, { useEffect } from 'react'

const SITE_IDENTIFIER = '0ffbbd1c-8d72-41d2-9186-e48f72320f96'
const SCRIPT_SRC =
  'https://hospitable.b-cdn.net/direct-property-search-widget/hospitable-search-widget.prod.js'

interface Props {
  resultsUrl?: string
}

export default function HospitableSearchWidget({ resultsUrl }: Props) {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    document.head.appendChild(script)
  }, [])

  const props: Record<string, string> = {
    identifier: SITE_IDENTIFIER,
    type: 'custom',
  }
  if (resultsUrl) props['results-url'] = resultsUrl

  return React.createElement('hospitable-direct-mps', props)
}
