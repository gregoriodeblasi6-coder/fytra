"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/app/components/BottomNav'

type NotifType = 'like' | 'comment' | 'reply' | 'follow' | 'mention' | 'achievement' | 'challenge' | 'ai'

type DbNotification = {
  id: string
  type: NotifType
  from_user_id: string | null
  target_post_id: string | null
  target_comment_id: string | null
  text: string | null
  read: boolean
  created_at: string
  from_user: { username: string | null; full_name: string | null; avatar_url: string | null } | null
}

type FilterType = 'tutte' | 'social' | 'sistema'

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [filter, setFilter] = useState<FilterType>('tutte')
  const [notifs, setNotifs] = useState<DbNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('notifications')
      .select('*, from_user:profiles!notifications_from_user_profiles_fkey(username, full_name, avatar_url)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(100)

    setNotifs((data as any) || [])
    setLoading(false)
  }

  const markAllRead = async () => {
    if (!user) return
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifs(notifs.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
  }

  const markOneRead = async (id: string) => {
    setNotifs(notifs.map(n => (n.id === id ? { ...n, read: true } : n)))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  const filtered = notifs.filter(n => {
    if (filter === 'tutte') return true
    if (filter === 'social') return ['like', 'comment', 'reply', 'follow', 'mention'].includes(n.type)
    if (filter === 'sistema') return ['achievement', 'challenge', 'ai'].includes(n.type)
    return true
  })

  const unreadCount = notifs.filter(n => !n.read).length

  const grouped = groupByTime(filtered)

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F7' }}>
      <div
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          minHeight: '100vh',
          background: '#F2F2F7',
          position: 'relative',
          boxShadow: '0 0 40px rgba(0,0,0,0.06)',
        }}
      >
        <header
          style={{
            background: 'rgba(242, 242, 247, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '14px 20px 10px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            borderBottom: '0.5px solid rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <button
              onClick={() => router.push('/feed')}
              aria-label="Indietro"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#007AFF',
                padding: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.5px', flex: 1 }}>
              Notifiche
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007AFF',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '6px 0',
                }}
              >
                Segna lette
              </button>
            )}
          </div>

          <div
            style={{
              background: 'rgba(118, 118, 128, 0.12)',
              borderRadius: '9px',
              padding: '2px',
              display: 'flex',
            }}
          >
            {(['tutte', 'social', 'sistema'] as FilterType[]).map(f => {
              const active = filter === f
              const labels: Record<FilterType, string> = { tutte: 'Tutte', social: 'Social', sistema: 'Sistema' }
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#000' : '#3C3C43',
                    background: active ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: '7px',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {labels[f]}
                </button>
              )
            })}
          </div>
        </header>

        <main style={{ padding: '4px 0 100px' }}>
          {loading && <LoadingSkeleton />}
          {!loading && filtered.length === 0 && <EmptyState filter={filter} />}
          {!loading && filtered.length > 0 && (
            <>
              {grouped.oggi.length > 0 && (
                <>
                  <SectionLabel>Oggi</SectionLabel>
                  {grouped.oggi.map(n => <NotificationRow key={n.id} notif={n} router={router} onMarkRead={markOneRead} />)}
                </>
              )}
              {grouped.settimana.length > 0 && (
                <>
                  <SectionLabel>Questa settimana</SectionLabel>
                  {grouped.settimana.map(n => <NotificationRow key={n.id} notif={n} router={router} onMarkRead={markOneRead} />)}
                </>
              )}
              {grouped.mese.length > 0 && (
                <>
                  <SectionLabel>Prima</SectionLabel>
                  {grouped.mese.map(n => <NotificationRow key={n.id} notif={n} router={router} onMarkRead={markOneRead} />)}
                </>
              )}
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function NotificationRow({
  notif,
  router,
  onMarkRead,
}: {
  notif: DbNotification
  router: ReturnType<typeof useRouter>
  onMarkRead: (id: string) => void
}) {
  const icon = getNotifIcon(notif.type)
  const fromName = notif.from_user?.full_name || notif.from_user?.username || 'Qualcuno'
  const text = buildNotifText(notif, fromName)

  const handleClick = () => {
    if (!notif.read) onMarkRead(notif.id)
    const route = getNotifRoute(notif)
    if (route) router.push(route)
  }

  return (
    <button
      onClick={handleClick}
      style={{
        width: '100%',
        padding: '12px 20px',
        background: !notif.read ? 'rgba(124, 169, 130, 0.06)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        textAlign: 'left',
        borderBottom: '0.5px solid rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: icon.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon.svg}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
        <p style={{ fontSize: '14px', color: '#000', margin: 0, lineHeight: 1.4, fontWeight: !notif.read ? 500 : 400 }}>
          {text}
        </p>
        <p style={{ fontSize: '12px', color: '#8E8E93', margin: '3px 0 0' }}>{formatTime(notif.created_at)}</p>
      </div>
      {!notif.read && (
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7CA982', marginTop: '10px', flexShrink: 0 }} />
      )}
    </button>
  )
}

function buildNotifText(n: DbNotification, fromName: string): React.ReactNode {
  if (n.type === 'like') return <><strong>{fromName}</strong> ha messo mi piace al tuo post</>
  if (n.type === 'comment') return <><strong>{fromName}</strong> ha commentato: {n.text?.slice(0, 80)}</>
  if (n.type === 'reply') return <><strong>{fromName}</strong> ha risposto al tuo commento: {n.text?.slice(0, 80)}</>
  if (n.type === 'follow') return <><strong>{fromName}</strong> ha iniziato a seguirti</>
  if (n.type === 'mention') return <><strong>{fromName}</strong> ti ha menzionato</>
  if (n.type === 'achievement') return n.text || 'Hai sbloccato un nuovo badge!'
  if (n.type === 'challenge') return n.text || 'Nuova sfida disponibile'
  if (n.type === 'ai') return n.text || 'Messaggio dal tuo AI Coach'
  return n.text || 'Notifica'
}

function getNotifRoute(n: DbNotification): string | null {
  if (n.target_post_id) return '/post/' + n.target_post_id
  if (n.type === 'follow' && n.from_user_id) return '/profile/' + n.from_user_id
  if (n.type === 'achievement') return '/profile'
  if (n.type === 'challenge') return '/discover'
  if (n.type === 'ai') return '/chat-ai'
  return null
}

function groupByTime(notifs: DbNotification[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(todayStart)
  weekAgo.setDate(weekAgo.getDate() - 7)

  return {
    oggi: notifs.filter(n => new Date(n.created_at) >= todayStart),
    settimana: notifs.filter(n => {
      const d = new Date(n.created_at)
      return d < todayStart && d >= weekAgo
    }),
    mese: notifs.filter(n => new Date(n.created_at) < weekAgo),
  }
}

function formatTime(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'ora'
  if (diff < 3600) return Math.floor(diff / 60) + ' min fa'
  if (diff < 86400) return Math.floor(diff / 3600) + ' ore fa'
  if (diff < 604800) return Math.floor(diff / 86400) + ' giorni fa'
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

function getNotifIcon(type: NotifType): { bg: string; svg: React.ReactNode } {
  switch (type) {
    case 'like':
      return { bg: 'rgba(255, 59, 48, 0.12)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#FF3B30" stroke="#FF3B30" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>) }
    case 'comment':
    case 'reply':
      return { bg: 'rgba(59, 130, 246, 0.12)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>) }
    case 'follow':
      return { bg: 'rgba(124, 169, 130, 0.15)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F7057" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>) }
    case 'mention':
      return { bg: 'rgba(139, 92, 246, 0.12)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" /></svg>) }
    case 'achievement':
      return { bg: 'rgba(232, 168, 87, 0.15)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#D17A3C" stroke="#D17A3C" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>) }
    case 'challenge':
      return { bg: 'rgba(209, 122, 60, 0.12)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D17A3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>) }
    case 'ai':
      return { bg: 'rgba(124, 169, 130, 0.15)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#7CA982" stroke="#7CA982" strokeWidth="2"><path d="M12 3l1.88 4.62L18.5 9.5l-4.62 1.88L12 16l-1.88-4.62L5.5 9.5l4.62-1.88z" /></svg>) }
    default:
      return { bg: 'rgba(142, 142, 147, 0.15)', svg: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /></svg>) }
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px',
      fontWeight: 700,
      color: '#8E8E93',
      letterSpacing: '0.5px',
      margin: '14px 20px 4px',
      textTransform: 'uppercase',
    }}>{children}</p>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="animate-pulse"
          style={{ padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E5E5EA' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '10px', width: '80%', background: '#E5E5EA', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ height: '8px', width: '30%', background: '#E5E5EA', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ filter }: { filter: FilterType }) {
  const titles: Record<FilterType, string> = { tutte: 'Nessuna notifica', social: 'Nessuna interazione', sistema: 'Nessun avviso' }
  const subs: Record<FilterType, string> = { tutte: 'Quando qualcosa succede, lo troverai qui.', social: 'Like, commenti e follower appariranno qui.', sistema: 'Avvisi AI, badge e sfide appariranno qui.' }

  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div
        style={{
          width: '68px', height: '68px', borderRadius: '20px',
          background: 'rgba(124, 169, 130, 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7CA982" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#000', margin: 0 }}>{titles[filter]}</p>
      <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 0', lineHeight: 1.4 }}>{subs[filter]}</p>
    </div>
  )
}
