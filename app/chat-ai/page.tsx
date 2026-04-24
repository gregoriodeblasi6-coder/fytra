"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/app/components/BottomNav'

type Message = {
  role: 'user' | 'bot'
  text: string
  time: string
}

type FaqCategory = 'nutrizione' | 'allenamento' | 'recupero' | 'obiettivi'

export default function ChatAIPage() {
  const router = useRouter()
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('nutrizione')
  const [showSuggestions, setShowSuggestions] = useState(true)

  const username = user?.email?.split('@')[0] || 'atleta'
  const now = () =>
    new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text:
        'Ciao ' + username + '! Sono il tuo AI Coach Fytra. Presto potro analizzare i tuoi pasti e allenamenti per darti consigli su misura. Per ora dai un occhio alle best practice qui sotto o prova una delle domande suggerite.',
      time: now(),
    },
  ])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const faqsByCategory: Record<FaqCategory, string[]> = {
    nutrizione: [
      'Quante proteine devo assumere al giorno?',
      'Come bilanciare carboidrati e grassi?',
      'Cosa mangiare prima di allenarsi?',
      'Cosa mangiare dopo allenamento?',
      'Quanti pasti al giorno sono ideali?',
    ],
    allenamento: [
      'Meglio cardio o pesi per dimagrire?',
      'Quante volte allenarsi a settimana?',
      'Come strutturare una scheda full body?',
      'Quanto deve durare un allenamento?',
      'Come progredire con i carichi?',
    ],
    recupero: [
      'Quanto devo dormire per recuperare bene?',
      'Quanti giorni di riposo servono?',
      'Come gestire i DOMS (dolori muscolari)?',
      'Stretching prima o dopo allenamento?',
      'Sauna e bagno freddo funzionano?',
    ],
    obiettivi: [
      'Come perdere grasso senza perdere muscoli?',
      'Quanto tempo per vedere risultati?',
      'Come costruire massa muscolare?',
      'Come migliorare la resistenza?',
      'Come mantenere la motivazione?',
    ],
  }

  const bestPractices = [
    {
      label: 'PROTEINE',
      value: '1.6-2.2',
      unit: 'g/kg',
      hint: 'Al giorno per chi si allena',
      color: '#7CA982',
    },
    {
      label: 'ACQUA',
      value: '35',
      unit: 'ml/kg',
      hint: 'Fabbisogno base giornaliero',
      color: '#3B82F6',
    },
    {
      label: 'SONNO',
      value: '7-9',
      unit: 'ore',
      hint: 'Per il recupero ottimale',
      color: '#8B5CF6',
    },
    {
      label: 'ALLENAMENTI',
      value: '3-5',
      unit: 'sett',
      hint: 'Frequenza sostenibile',
      color: '#D17A3C',
    },
  ]

  const handleFAQ = (q: string) => {
    setShowSuggestions(false)
    setMessages(prev => [
      ...prev,
      { role: 'user', text: q, time: now() },
      {
        role: 'bot',
        text:
          'Ottima domanda! Presto collegheremo l AI per risponderti in modo preciso basandomi sui tuoi pasti e allenamenti. Per ora dai un occhio alle best practice qui sopra.',
        time: now(),
      },
    ])
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setShowSuggestions(false)
    setInput('')
    setMessages(prev => [
      ...prev,
      { role: 'user', text, time: now() },
      {
        role: 'bot',
        text:
          'Grazie del messaggio! L AI sara attiva nei prossimi aggiornamenti. Intanto puoi consultare le best practice o continuare a postare pasti e allenamenti nel feed.',
        time: now(),
      },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <header
          style={{
            background: 'rgba(242, 242, 247, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '12px 16px 10px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#7CA982',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.88 4.62L18.5 9.5l-4.62 1.88L12 16l-1.88-4.62L5.5 9.5l4.62-1.88z" />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#30D158',
                  border: '2px solid #F2F2F7',
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#000', margin: 0, letterSpacing: '-0.2px' }}>
                  AI Coach
                </h1>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#D17A3C',
                    background: 'rgba(209, 122, 60, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                  }}
                >
                  BETA
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#30D158', margin: 0, fontWeight: 500 }}>
                Online in anteprima
              </p>
            </div>
          </div>
        </header>

        {/* MESSAGES + PRACTICES SCROLL AREA */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            paddingBottom: '180px',
          }}
        >
          {/* BEST PRACTICES CARD */}
          <div
            style={{
              background: '#FFF',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#7CA982" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: 0 }}>
                Best practice fitness
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#8E8E93', margin: '0 0 12px', lineHeight: 1.4 }}>
              Valori di riferimento per chi si allena regolarmente. Non sostituiscono un parere medico.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {bestPractices.map(bp => (
                <div
                  key={bp.label}
                  style={{
                    background: '#F2F2F7',
                    borderRadius: '10px',
                    padding: '10px',
                  }}
                >
                  <p style={{ fontSize: '10px', fontWeight: 700, color: bp.color, letterSpacing: '0.5px', margin: 0 }}>
                    {bp.label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#000', lineHeight: 1 }}>
                      {bp.value}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#8E8E93' }}>
                      {bp.unit}
                    </span>
                  </div>
                  <p style={{ fontSize: '10px', color: '#8E8E93', margin: '4px 0 0', lineHeight: 1.3 }}>
                    {bp.hint}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* EXAMPLE TRAINING CARD */}
          <div
            style={{
              background: '#FFF',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D17A3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 6.5h11v11h-11z" />
                <path d="M9.5 9.5h5v5h-5z" />
                <path d="M6.5 2v4M17.5 2v4M6.5 18v4M17.5 18v4M2 6.5h4M2 17.5h4M18 6.5h4M18 17.5h4" />
              </svg>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: 0 }}>
                Esempio scheda allenamento
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#8E8E93', margin: '0 0 10px', lineHeight: 1.4 }}>
              Full body 3x a settimana per chi inizia
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { ex: 'Squat', sets: '4x10', note: 'Gambe' },
                { ex: 'Panca piana', sets: '4x8', note: 'Petto' },
                { ex: 'Stacchi da terra', sets: '3x8', note: 'Schiena' },
                { ex: 'Rematore', sets: '4x10', note: 'Schiena' },
                { ex: 'Military press', sets: '3x10', note: 'Spalle' },
                { ex: 'Plank', sets: '3x30s', note: 'Core' },
              ].map(row => (
                <div
                  key={row.ex}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#F2F2F7',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#000', margin: 0 }}>
                      {row.ex}
                    </p>
                    <p style={{ fontSize: '11px', color: '#8E8E93', margin: '1px 0 0' }}>
                      {row.note}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#D17A3C',
                      background: 'rgba(209, 122, 60, 0.12)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {row.sets}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {messages.map((m, i) => {
              const prevSameSender = i > 0 && messages[i - 1].role === m.role
              if (m.role === 'user') {
                return (
                  <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '78%' }}>
                    <div
                      style={{
                        background: '#7CA982',
                        color: '#FFF',
                        padding: '9px 13px',
                        borderRadius: '18px',
                        borderBottomRightRadius: '4px',
                        fontSize: '15px',
                        lineHeight: 1.35,
                      }}
                    >
                      {m.text}
                    </div>
                    <p style={{ fontSize: '10px', color: '#8E8E93', textAlign: 'right', margin: '3px 8px 0' }}>
                      {m.time}
                    </p>
                  </div>
                )
              }
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '82%',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'flex-end',
                  }}
                >
                  {!prevSameSender ? (
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        background: '#7CA982',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginBottom: '14px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFF" stroke="none">
                        <path d="M12 3l1.88 4.62L18.5 9.5l-4.62 1.88L12 16l-1.88-4.62L5.5 9.5l4.62-1.88z" />
                      </svg>
                    </div>
                  ) : (
                    <div style={{ width: '26px', flexShrink: 0 }} />
                  )}
                  <div>
                    <div
                      style={{
                        background: '#FFF',
                        color: '#000',
                        padding: '9px 13px',
                        borderRadius: '18px',
                        borderBottomLeftRadius: prevSameSender ? '18px' : '4px',
                        fontSize: '15px',
                        lineHeight: 1.4,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    >
                      {m.text}
                    </div>
                    <p style={{ fontSize: '10px', color: '#8E8E93', margin: '3px 8px 0' }}>
                      {m.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* SUGGESTIONS (category tabs + chips) */}
          {showSuggestions && (
            <div
              style={{
                background: '#FFF',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', margin: '0 0 10px', letterSpacing: '0.3px' }}>
                DOMANDE SUGGERITE
              </p>

              {/* Category pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '10px',
                  overflowX: 'auto',
                  paddingBottom: '2px',
                }}
              >
                {(
                  [
                    { key: 'nutrizione', label: 'Nutrizione' },
                    { key: 'allenamento', label: 'Allenamento' },
                    { key: 'recupero', label: 'Recupero' },
                    { key: 'obiettivi', label: 'Obiettivi' },
                  ] as { key: FaqCategory; label: string }[]
                ).map(cat => {
                  const active = activeCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: active ? '#7CA982' : '#F2F2F7',
                        color: active ? '#FFF' : '#3C3C43',
                        flexShrink: 0,
                      }}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              {/* FAQ chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {faqsByCategory[activeCategory].map(q => (
                  <button
                    key={q}
                    onClick={() => handleFAQ(q)}
                    style={{
                      textAlign: 'left',
                      background: '#F2F2F7',
                      border: 'none',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      color: '#000',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span style={{ flex: 1 }}>{q}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        <div
          style={{
            position: 'fixed',
            bottom: '72px',
            left: 0,
            right: 0,
            background: 'rgba(242, 242, 247, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
            padding: '8px 0',
            zIndex: 15,
          }}
        >
          <div
            style={{
              maxWidth: '430px',
              margin: '0 auto',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
            }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi al tuo coach..."
              rows={1}
              style={{
                flex: 1,
                background: '#FFF',
                border: '0.5px solid rgba(0,0,0,0.1)',
                borderRadius: '20px',
                padding: '9px 14px',
                fontSize: '15px',
                color: '#000',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                minHeight: '38px',
                maxHeight: '100px',
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Invia"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: input.trim() ? '#7CA982' : '#C7C7CC',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
