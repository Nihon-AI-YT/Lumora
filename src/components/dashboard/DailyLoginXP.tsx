'use client'
import { useEffect } from 'react'

export default function DailyLoginXP({ isNewDay }: { isNewDay: boolean }) {
  useEffect(() => {
    if (!isNewDay) return
    fetch('/api/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'daily_login',
        metadata: { localHour: new Date().getHours(), localDay: new Date().getDay() }
      })
    }).catch(err => console.error('XP award failed:', err))
  }, [isNewDay])

  return null
}