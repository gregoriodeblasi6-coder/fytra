"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/app/components/BottomNav'

type ConversationType = 'ai' | 'friend'

type Conversation = {
  id: string
  type: ConversationType
  name: string
  username: string
  lastMessage: string
  lastTime: string
  unread: number
  avatar: { bg: string; text: string }
  pinned?: boolean
  online?: boolean
}

type MessageRequest = {
  id: string
  name: string
  username: string
  message: string
  time: string
  avatar: { bg: string; text: string }
}

type TabView = 'chat' | 'richieste'

export default function ChatListPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<TabView>('chat')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, router])

  const aiConversation: Conversation = {
    id: 'ai-coach',
    type: 'ai',
    name: 'AI Coach Fytra',
    username: 'fytra_ai',
    lastMessage: 'Ciao! Sono pronto ad analizzare i tuoi pasti e allenamenti.',
    lastTime: 'ora',
    unread: 0,
    avatar: { bg: '#7CA982', text: '#FFFFFF' },
    pinned: true,
    online: true,
  }

  const friendConversations: Conversation[] = []
  const messageRequests: MessageRequest[] = []

  const allConvos = [aiConversation, ...friendConversations]
  const filtered = query.trim()
    ? allConvos.filter(
        c =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.username.toLowerCase().includes(query.toLowerCase())
      )
    : allConvos

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.5px' }}>
              Chat
            </h1>
            <button
              onClick={() => router.push('/discover')}
              aria-label="Nuova chat"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.04)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
              </svg>
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8E8E93"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca chat"
              style={{
                width: '100%',
                height: '38px',
                padding: '0 36px',
                background: 'rgba(118, 118, 128, 0.12)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#000',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {!query && (
            <div
              style={{
                background: 'rgba(118, 118, 128, 0.12)',
                borderRadius: '9px',
                padding: '2px',
                display: 'flex',
              }}
            >
              <button onClick={() => setTab('chat')} style={tabBtnStyle(tab === 'chat')}>
                Chat
              </button>
              <button onClick={() => setTab('richieste')} style={tabBtnStyle(tab === 'richieste')}>
                Richieste
                {messageRequests.length > 0 && (
                  <span style={{
                    marginLeft: '4px',
                    background: '#FF3B30',
                    color: '#FFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '8px',
                  }}>
                    {messageRequests.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </header>

        <main style={{ padding: '8px 0 100px' }}>
          {tab === 'chat' && (
            <>
              {filtered.some(c => c.pinned) && !query && <SectionLabel>Fissate</SectionLabel>}
              {filtered.filter(c => c.pinned).map(c => (
                <ConversationRow key={c.id} convo={c} onClick={() => openChat(c, router)} />
              ))}

              {filtered.filter(c => !c.pinned).length > 0 && (
                <>
                  {filtered.some(c => c.pinned) && !query && <SectionLabel>Messaggi</SectionLabel>}
                  {filtered.filter(c => !c.pinned).map(c => (
                    <ConversationRow key={c.id} convo={c} onClick={() => openChat(c, router)} />
                  ))}
                </>
              )}

              {friendConversations.length === 0 && !query && <EmptyFriendsHint router={router} />}
            </>
          )}

          {tab === 'richieste' && (
            <>
              {messageRequests.length === 0 ? (
                <EmptyState
                  title="Nessuna richiesta"
                  subtitle="Quando qualcuno che non segui ti scrive, lo troverai qui."
                />
              ) : (
                messageRequests.map(r => <RequestRow key={r.id} req={r} />)
              )}
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function openChat(c: Conversation, router: ReturnType<typeof useRouter>) {
  if (c.type === 'ai') {
    router.push('/chat-ai')
  } else {
    alert('Chat con amici in arrivo')
  }
}

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px',
      fontWeight: 700,
      color: '#8E8E93',
      letterSpacing: '0.5px',
      margin: '14px 20px 6px',
      textTransform: 'uppercase',
    }}>
      {children}
    </p>
  )
}

function ConversationRow({ convo, onClick }: { convo: Conversation; onClick: () => void }) {
  const isAi = convo.type === 'ai'

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 20px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'left',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {isAi ? (
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7CA982, #5B8C7B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(124, 169, 130, 0.3)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFF" stroke="none">
              <path d="M12 3l1.88 4.62L18.5 9.5l-4.62 1.88L12 16l-1.88-4.62L5.5 9.5l4.62-1.88z" />
            </svg>
          </div>
        ) : (
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: convo.avatar.bg,
              color: convo.avatar.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {convo.name[0].toUpperCase()}
          </div>
        )}
        {convo.online && (
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#30D158',
              border: '2px solid #F2F2F7',
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {convo.name}
          </p>
          {isAi && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(124, 169, 130, 0.18)',
                color: '#4F7057',
                letterSpacing: '0.3px',
                flexShrink: 0,
              }}
            >
              AI
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: '13px',
            color: convo.unread > 0 ? '#000' : '#8E8E93',
            fontWeight: convo.unread > 0 ? 500 : 400,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '240px',
          }}
        >
          {convo.lastMessage}
        </p>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0, fontWeight: 400 }}>
          {convo.lastTime}
        </p>
        {convo.unread > 0 ? (
          <div
            style={{
              background: '#7CA982',
              color: '#FFF',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '10px',
              padding: '2px 7px',
              minWidth: '20px',
              textAlign: 'center',
            }}
          >
            {convo.unread > 99 ? '99+' : convo.unread}
          </div>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </button>
  )
}

function RequestRow({ req }: { req: MessageRequest }) {
  return (
    <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: req.avatar.bg,
          color: req.avatar.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {req.name[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>{req.name}</p>
        <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {req.message}
        </p>
      </div>
    </div>
  )
}

function EmptyFriendsHint({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div style={{ padding: '30px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'rgba(124, 169, 130, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7CA982" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>
        Nessuna chat con amici
      </p>
      <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 14px', lineHeight: 1.4 }}>
        Segui altre persone su Fytra per poterci chattare.
      </p>
      <button
        onClick={() => router.push('/discover')}
        style={{
          padding: '10px 22px',
          background: '#7CA982',
          color: '#FFF',
          border: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(124, 169, 130, 0.3)',
        }}
      >
        Scopri persone
      </button>
    </div>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 24px' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'rgba(142, 142, 147, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 0', lineHeight: 1.4 }}>{subtitle}</p>
    </div>
  )
}
