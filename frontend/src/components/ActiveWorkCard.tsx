'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function ActiveWorkCard() {
  const [imageError, setImageError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    // Get last update time
    const now = new Date().toLocaleString()
    setLastUpdate(now)
  }, [])

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-teal-300 flex items-center gap-2">
          <span className="text-lg">📊</span>
          Active Work
        </h3>
        <span className="text-xs text-blue-200 opacity-70">14 days</span>
      </div>

      {imageError ? (
        <div className="flex h-24 w-full items-center justify-center rounded-lg bg-slate-700/50">
          <p className="text-xs text-slate-400">Graph not yet generated</p>
        </div>
      ) : (
        <div className="relative h-24 w-full">
          <Image
            src="/active-work.svg"
            alt="Active work graph showing commits over the last 14 days"
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            className="rounded-lg object-cover"
            onError={() => setImageError(true)}
            priority
          />
        </div>
      )}

      <p className="mt-3 text-xs text-blue-100 flex items-center gap-2">
        <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
        Commits over the last 14 days
      </p>

      {lastUpdate && (
        <p className="mt-1 text-xs text-slate-400">
          Updated: {lastUpdate}
        </p>
      )}
    </div>
  )
}
