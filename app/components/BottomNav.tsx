"use client"

import { useRouter, usePathname } from 'next/navigation'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { key: 'feed', label: 'Feed', path: '/feed', icon: 'home' as const },
    { key: 'search', label: 'Scopri', path: '/discover', icon: 'search' as const },
    { key: 'create', label: '', path: '/new-post', icon: 'plus' as const, primary: true },
    { key: 'chat', label: 'Chat', path: '/chat', icon: 'chat' as const },
    { key: 'profile', label: 'Profilo', path: '/profile', icon: 'user' as const },
  ]

  const isActive = (path: string) => {
    if (path === '/feed' && (pathname === '/' || pathname === '/feed')) return true
    if (path === '/chat' && (pathname === '/chat' || pathname === '/chat-ai' || pathname?.startsWith('/chat/'))) return true
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '6px 8px 8px',
        }}
      >
        {tabs.map(tab => {
          const active = isActive(tab.path)

          if (tab.primary) {
            return (
              <button
                key={tab.key}
                onClick={() => router.push(tab.path)}
                aria-label="Crea post"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  background: '#7CA982',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(124, 169, 130, 0.35), 0 2px 4px rgba(124, 169, 130, 0.25)',
                  marginTop: '-8px',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <TabIcon name={tab.icon} active={true} size={24} color="#FFFFFF" />
              </button>
            )
          }

          const color = active ? '#7CA982' : '#8E8E93'

          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.path)}
              aria-label={tab.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                minWidth: '56px',
                transition: 'opacity 0.15s',
              }}
              onMouseDown={e => (e.currentTarget.style.opacity = '0.5')}
              onMouseUp={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <TabIcon name={tab.icon} active={active} size={24} color={color} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: active ? 600 : 500,
                  color,
                  letterSpacing: '0.1px',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function TabIcon({
  name,
  active,
  size,
  color,
}: {
  name: 'home' | 'search' | 'plus' | 'chat' | 'user'
  active: boolean
  size: number
  color: string
}) {
  const fill = active && name !== 'plus' && name !== 'search' ? color : 'none'
  const strokeWidth = active ? 2 : 1.7

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'home' && (
        <>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" fill="none" stroke={active ? '#FFFFFF' : color} />
        </>
      )}
      {name === 'search' && (
        <>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </>
      )}
      {name === 'plus' && (
        <>
          <line x1="12" y1="5" x2="12" y2="19" strokeWidth={2.5} />
          <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2.5} />
        </>
      )}
      {name === 'chat' && (
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      )}
      {name === 'user' && (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      )}
    </svg>
  )
}
