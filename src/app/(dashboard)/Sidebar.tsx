'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
interface Chat {
  id: string
  title: string
  updated_at: string
}

interface Props {
  name: string
  userId: string
}

export default function Sidebar({ name, userId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [chats, setChats] = useState<Chat[]>([])
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [exams, setExams] = useState<{ id: string; name: string; exam_date: string }[]>([])
  const [newExamName, setNewExamName] = useState('')
  const [newExamDate, setNewExamDate] = useState('')

  useEffect(() => {
    if (settingsOpen) loadExams()
  }, [settingsOpen])

  async function loadExams() {
    const res = await fetch('/api/exams')
    const data = await res.json()
    if (data.exams) setExams(data.exams)
  }
  async function addExam() {
    if (!newExamName || !newExamDate) return
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newExamName, exam_date: newExamDate })
    })
    const data = await res.json()
    if (data.exam) {
      setExams(prev => [...prev, data.exam].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()))
      setNewExamName('')
      setNewExamDate('')
    }
  }

  async function deleteExam(id: string) {
    await fetch('/api/exams', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setExams(prev => prev.filter(e => e.id !== id))
  }

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('lumora-theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('lumora-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  useEffect(() => { loadChats() }, [pathname])

  useEffect(() => {
    const interval = setInterval(loadChats, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClose() { setMenuOpen(null) }
    document.addEventListener('mousedown', handleClose)
    return () => document.removeEventListener('mousedown', handleClose)
  }, [])

  async function loadChats() {
    const { data } = await supabase
      .from('tutor_chats')
      .select('id, title, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (data) setChats(data)
  }

  async function newChat() {
    const { data } = await supabase
      .from('tutor_chats')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single()
    if (data) router.push(`/tutor/${data.id}`)
  }

  async function deleteChat(id: string) {
    await supabase.from('tutor_chats').delete().eq('id', id)
    setMenuOpen(null)
    setChats(prev => prev.filter(c => c.id !== id))
    if (pathname === `/tutor/${id}`) router.push('/tutor')
  }

  async function renameChat(id: string) {
    if (!renameValue.trim()) return
    await supabase.from('tutor_chats').update({ title: renameValue.trim() }).eq('id', id)
    setChats(prev => prev.map(c => c.id === id ? { ...c, title: renameValue.trim() } : c))
    setRenamingId(null)
    setMenuOpen(null)
  }

  function shareChat(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/tutor/${id}`)
    setCopied(true)
    setMenuOpen(null)
    setTimeout(() => setCopied(false), 2000)
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/flashcards', label: 'Flashcards' },
    { href: '/mcq', label: 'MCQ Practice' },
    { href: '/exam', label: 'Practice Exam' },
    { href: '/review', label: 'Review' },
  ]

  const dropdown = menuOpen && mounted ? createPortal(
    <div
      style={{
        position: 'fixed', left: menuPos.x, top: menuPos.y,
        background: 'white', border: '1px solid #e8e0f0', borderRadius: '10px',
        padding: '4px', zIndex: 99999, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: '150px',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      <button onMouseDown={e => { e.stopPropagation(); setRenamingId(menuOpen); setRenameValue(chats.find(c => c.id === menuOpen)?.title || ''); setMenuOpen(null) }}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#1a1a2e' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f0ff')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >Rename</button>
      <button onMouseDown={e => { e.stopPropagation(); shareChat(menuOpen) }}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#1a1a2e' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f0ff')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >Share link</button>
      <button onMouseDown={e => { e.stopPropagation(); deleteChat(menuOpen) }}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >Delete</button>
    </div>,
    document.body
  ) : null

  const settingsModal = settingsOpen && mounted ? createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
      }}
      onMouseDown={() => setSettingsOpen(false)}
    >
      <div
        style={{
          background: 'white', borderRadius: '20px', padding: '28px',
          width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #e8e0f0'
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Settings</h2>
          <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Plan */}
        <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Free Plan</p>
              <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '2px 0 0' }}>Limited daily usage</p>
            </div>
            <button style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: 'white',
              border: 'none', borderRadius: '8px', padding: '6px 14px',
              fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer'
            }}>Upgrade to Pro</button>
          </div>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: '10px' }}>Appearance</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setTheme('light'); localStorage.setItem('lumora-theme', 'light'); document.documentElement.setAttribute('data-theme', 'light') }}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                border: theme === 'light' ? '2px solid #a855f7' : '1px solid #e8e0f0',
                background: theme === 'light' ? 'rgba(168,85,247,0.06)' : 'white',
                color: theme === 'light' ? '#9333ea' : '#6b7280',
                fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.15s'
              }}
            >☀️ Light</button>
            <button
              disabled
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'not-allowed',
                border: '1px solid #e8e0f0',
                background: 'white',
                color: '#9ca3af',
                fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.15s',
                opacity: 0.4
              }}
            >🌙 Dark (soon)</button>
          </div>
        </div>

        {/* Sign out */}
        

        {/* Sign out */}
        <div style={{ borderTop: '1px solid #e8e0f0', paddingTop: '16px', marginTop: '8px' }}>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              border: '1px solid #fecaca', background: 'rgba(239,68,68,0.04)',
              color: '#ef4444', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
            }}
          >Sign out</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <style>{`
        .sidebar {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px);
          border-right: 1px solid #e8e0f0;
        }
        .nav-link {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .nav-link:hover, .nav-link.active {
          background: rgba(168,85,247,0.09);
          color: #9333ea;
        }
        .new-chat-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px dashed #e8e0f0;
          background: transparent;
          color: #9ca3af;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 4px;
        }
        .new-chat-btn:hover {
          border-color: #a855f7;
          color: #9333ea;
          background: rgba(168,85,247,0.05);
        }
        .chat-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .chat-item:hover { background: rgba(168,85,247,0.06); }
        .chat-item.active { background: rgba(168,85,247,0.09); }
        .chat-title {
          font-size: 0.78rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .chat-item.active .chat-title { color: #9333ea; }
        .chat-menu-btn {
          opacity: 0;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .chat-item:hover .chat-menu-btn { opacity: 1; }
        .rename-input {
          flex: 1;
          font-size: 0.78rem;
          border: 1px solid #a855f7;
          border-radius: 6px;
          padding: 2px 6px;
          outline: none;
          color: #1a1a2e;
        }
        .section-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #c4b5d4;
          padding: 0 12px;
          margin-bottom: 4px;
          margin-top: 16px;
        }
        .copied-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a2e;
          color: white;
          font-size: 0.8rem;
          padding: 8px 16px;
          border-radius: 20px;
          z-index: 9999;
        }
        .user-btn {
          display: flex;
          align-items: center;
          gap: 3px;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 4px;
          border-radius: 10px;
          transition: background 0.15s;
          text-align: left;
        }
        .user-btn:hover { background: rgba(168,85,247,0.06); }
      `}</style>

      {dropdown}
      {settingsModal}
      {copied && <div className="copied-toast">Link copied to clipboard</div>}

      <aside className="sidebar w-56 flex flex-col py-6 px-3 fixed h-full z-10">

        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mb-8">
          <Image src="/lumora-nebula.png" alt="Lumora" width={32} height={32} className="object-contain" />
          <span className="font-bold text-lg" style={{ color: '#1a1a2e' }}>Lumora</span>
        </div>

        {/* Main nav */}
        <div className="section-label">Menu</div>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* AI Tutor section */}
        <div className="section-label">AI Tutor</div>
        <div className="flex flex-col gap-1 flex-1 overflow-hidden">
          <button className="new-chat-btn" onClick={newChat}>
            <span style={{ fontSize: '1rem' }}>+</span> New chat
          </button>
          <div className="flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: '280px' }}>
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${pathname === `/tutor/${chat.id}` ? 'active' : ''}`}
                onClick={() => { if (renamingId !== chat.id) router.push(`/tutor/${chat.id}`) }}
              >
                {renamingId === chat.id ? (
                  <input
                    className="rename-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renameChat(chat.id); if (e.key === 'Escape') setRenamingId(null) }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="chat-title">{chat.title}</span>
                )}
                <button
                  className="chat-menu-btn"
                  onClick={e => {
                    e.stopPropagation()
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setMenuPos({ x: rect.left - 110, y: rect.bottom + 6 })
                    setMenuOpen(menuOpen === chat.id ? null : chat.id)
                  }}
                >•••</button>
              </div>
            ))}
          </div>
        </div>

        {/* User — clickable to open settings */}
        <div className="pt-4 px-1" style={{ borderTop: '1px solid #e8e0f0' }}>
          <button className="user-btn" onClick={() => setSettingsOpen(true)}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
              <span className="text-white text-sm font-semibold">{name[0].toUpperCase()}</span>
            </div>
            <div style={{ marginLeft: '8px', flex: 1, minWidth: 0 }}>
              <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{name}</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Free plan</p>
            </div>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>⚙️</span>
          </button>
        </div>

      </aside>
    </>
  )
}