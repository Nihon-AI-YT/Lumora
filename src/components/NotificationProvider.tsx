'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  icon: string
  link?: string
  read: boolean
  created_at: string
}

interface ToastNotification {
  id: string
  title: string
  message: string
  icon: string
  link?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  toasts: ToastNotification[]
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  refresh: () => void
  awardXP: (action: string, metadata?: Record<string, unknown>) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [levelUpData, setLevelUpData] = useState<{ level: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const prevUnreadRef = useRef(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        const newUnread = data.unreadCount || 0

        // Show toast for new notifications
        if (newUnread > prevUnreadRef.current) {
          const newOnes = data.notifications.filter((n: Notification) => !n.read).slice(0, newUnread - prevUnreadRef.current)
          newOnes.forEach((n: Notification) => {
            addToast({ id: n.id, title: n.title, message: n.message, icon: n.icon, link: n.link })
            if (n.type === 'level_up') {
              setLevelUpData({ level: n.title.replace("Level Up! You're now ", '') })
              setTimeout(() => setLevelUpData(null), 4000)
            }
          })
        }

        prevUnreadRef.current = newUnread
        setUnreadCount(newUnread)
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }, [])

  const addToast = (toast: ToastNotification) => {
    setToasts(prev => [...prev, toast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 4000)
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1)
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    prevUnreadRef.current = 0
  }

  const clearAll = async () => {
    await fetch('/api/notifications', { method: 'DELETE' })
    setNotifications([])
    setUnreadCount(0)
    prevUnreadRef.current = 0
  }

  const awardXP = useCallback(async (action: string, metadata: Record<string, unknown> = {}) => {
    try {
      const res = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, metadata }),
      })
      const data = await res.json()

      if (data.earnedXP) {
        addToast({
          id: `xp-${Date.now()}`,
          title: `+${data.earnedXP} XP${data.multiplier > 1 ? ` (${data.multiplier}x streak!)` : ''}`,
          message: data.nudge || `Keep it up — you're on a roll!`,
          icon: '⚡',
          link: '/achievements',
        })
      }

      if (data.leveledUp) {
        setLevelUpData({ level: data.level.name })
        setTimeout(() => setLevelUpData(null), 4000)
      }

      // Refresh notifications after XP award
      setTimeout(fetchNotifications, 500)
    } catch (e) {
      console.error('XP award failed', e)
    }
  }, [fetchNotifications])

  // Initial fetch, then poll every 20s as a fallback in case Realtime
  // isn't picking up inserts from pages that call /api/xp directly
  // instead of through this context's awardXP.
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 20000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Supabase realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, toasts,
      markRead, markAllRead, clearAll,
      refresh: fetchNotifications, awardXP,
    }}>
      {children}

      {/* WhatsApp-style toast stack */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast, i) => (
          <div
            key={toast.id}
            onClick={() => { if (toast.link) router.push(toast.link) }}
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '16px',
              padding: '14px 18px',
              minWidth: '280px',
              maxWidth: '340px',
              boxShadow: '0 8px 32px rgba(168,85,247,0.18)',
              cursor: toast.link ? 'pointer' : 'default',
              pointerEvents: 'all',
              animation: 'slideInToast 0.3s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              transform: `translateY(${-i * 4}px)`,
            }}
          >
            <span style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>{toast.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '13px', color: '#1a1a2e' }}>
                {toast.title}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', lineHeight: 1.4 }}>
                {toast.message}
              </p>
            </div>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              flexShrink: 0, marginTop: '4px',
            }} />
          </div>
        ))}
      </div>

      {/* Level up full screen burst */}
      {levelUpData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          animation: 'fadeInLevelUp 0.4s ease',
          pointerEvents: 'none',
        }}>
          <div style={{
            textAlign: 'center',
            animation: 'scaleInLevelUp 0.4s ease',
          }}>
            <div style={{ fontSize: '80px', marginBottom: '16px', filter: 'drop-shadow(0 0 24px #a855f7)' }}>
              🎉
            </div>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 500 }}>
              LEVEL UP
            </p>
            <p style={{
              fontSize: '36px', fontWeight: 800, margin: '0 0 8px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {levelUpData.level}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              You&apos;re getting unstoppable 🔥
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInLevelUp {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInLevelUp {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </NotificationContext.Provider>
  )
}