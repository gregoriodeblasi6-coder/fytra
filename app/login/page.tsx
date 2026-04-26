"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const router = useRouter()

  const passwordStrength = (): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '#E5E5EA' }
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 1) return { score: 1, label: 'Debole', color: '#FF3B30' }
    if (score <= 2) return { score: 2, label: 'Media', color: '#FF9500' }
    if (score <= 3) return { score: 3, label: 'Buona', color: '#FFCC00' }
    return { score: 4, label: 'Forte', color: '#30D158' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Controlla la tua email per confermare la registrazione.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/onboarding')
      }
    }
    setLoading(false)
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
    setMessage('')
  }

  const strength = passwordStrength()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F2F2F7',
      }}
    >
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
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* HERO TOP */}
        <div
          style={{
            padding: '48px 24px 32px',
            textAlign: 'center',
          }}
        >
          {/* Logo animated appearance */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '20px',
                background: '#7CA982',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(124, 169, 130, 0.3), 0 2px 6px rgba(124, 169, 130, 0.2)',
              }}
            >
              <svg width="52" height="52" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" aria-label="Fytra">
                <path
                  d="M 220 140 Q 220 120 240 120 L 400 120 Q 420 120 420 140 Q 420 160 400 160 L 260 160 L 260 250 L 370 250 Q 390 250 390 270 Q 390 290 370 290 L 260 290 L 260 460 Q 260 480 240 480 Q 220 480 220 460 Z"
                  fill="#FFFFFF"
                />
                <path
                  d="M 295 205 Q 345 205 345 250 Q 345 275 320 275"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="10"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>

          <h1
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#000',
              margin: 0,
              letterSpacing: '-0.8px',
              lineHeight: 1,
            }}
          >
            Fytra
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#3C3C43',
              margin: '8px 0 0',
              fontWeight: 400,
              maxWidth: '280px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.4,
            }}
          >
            Il tuo coach AI, il tuo feed, la tua forma.
          </p>
        </div>

        {/* FORM CARD */}
        <div
          style={{
            flex: 1,
            padding: '0 16px 16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              padding: '22px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            {/* Toggle Login / Signup */}
            <div
              style={{
                background: '#F2F2F7',
                borderRadius: '10px',
                padding: '3px',
                display: 'flex',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => !isSignUp || toggleMode()}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: !isSignUp ? 600 : 500,
                  color: !isSignUp ? '#000' : '#3C3C43',
                  background: !isSignUp ? '#FFF' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: !isSignUp ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => isSignUp || toggleMode()}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: isSignUp ? 600 : 500,
                  color: isSignUp ? '#000' : '#3C3C43',
                  background: isSignUp ? '#FFF' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: isSignUp ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Registrati
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email field */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#8E8E93',
                    letterSpacing: '0.3px',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nome@email.com"
                    required
                    autoComplete="email"
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 14px 0 42px',
                      background: '#F2F2F7',
                      border: '1.5px solid transparent',
                      borderRadius: '12px',
                      fontSize: '15px',
                      color: '#000',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s, background 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#7CA982'
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.background = '#F2F2F7'
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#8E8E93',
                    letterSpacing: '0.3px',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Almeno 6 caratteri' : 'La tua password'}
                    minLength={6}
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 46px 0 42px',
                      background: '#F2F2F7',
                      border: '1.5px solid transparent',
                      borderRadius: '12px',
                      fontSize: '15px',
                      color: '#000',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s, background 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#7CA982'
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.background = '#F2F2F7'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '28px',
                      height: '28px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      color: '#8E8E93',
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength (only signup) */}
                {isSignUp && password && (
                  <div style={{ marginTop: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '4px',
                      }}
                    >
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: '3px',
                            borderRadius: '2px',
                            background: i <= strength.score ? strength.color : '#E5E5EA',
                            transition: 'background 0.2s',
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: strength.color, margin: 0, fontWeight: 600 }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Remember me + forgot password (only login) */}
              {!isSignUp && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#3C3C43',
                      userSelect: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        background: rememberMe ? '#7CA982' : '#FFF',
                        border: rememberMe ? 'none' : '1.5px solid #C7C7CC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      {rememberMe && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>Resta connesso</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMessage('Funzione in arrivo: inviaci una mail a support@fytra.app')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#7CA982',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Password dimenticata?
                  </button>
                </div>
              )}

              {/* Error / Success message */}
              {error && (
                <div
                  style={{
                    background: 'rgba(255, 59, 48, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF3B30" stroke="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="#FFF" strokeWidth="2" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="#FFF" strokeWidth="2" />
                  </svg>
                  <p style={{ fontSize: '13px', color: '#C53030', margin: 0, lineHeight: 1.4 }}>
                    {error}
                  </p>
                </div>
              )}

              {message && (
                <div
                  style={{
                    background: 'rgba(48, 209, 88, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#30D158" stroke="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="16 10 11 15 8 12" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p style={{ fontSize: '13px', color: '#147A2E', margin: 0, lineHeight: 1.4 }}>
                    {message}
                  </p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{
                  width: '100%',
                  height: '50px',
                  background: loading || !email || !password ? '#C7C7CC' : '#7CA982',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                  boxShadow: loading || !email || !password ? 'none' : '0 2px 8px rgba(124, 169, 130, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#FFF',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Attendi...
                  </>
                ) : isSignUp ? (
                  'Crea account'
                ) : (
                  'Accedi'
                )}
              </button>
            </form>

            {/* Privacy / Termini disclaimer (solo signup) */}
            {isSignUp && (
              <p style={{ fontSize: '11px', color: '#8E8E93', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.4 }}>
                Continuando accetti i nostri{' '}
                <a href="/terms" style={{ color: '#7CA982', textDecoration: 'underline', fontWeight: 600 }}>Termini</a>
                {' '}e l{'\u2019'}{' '}
                <a href="/privacy" style={{ color: '#7CA982', textDecoration: 'underline', fontWeight: 600 }}>Informativa Privacy</a>.
              </p>
            )}

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '20px 0',
              }}
            >
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.3px' }}>
                OPPURE
              </span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.1)' }} />
            </div>

            {/* Social buttons (placeholder) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setMessage('Accesso con Apple in arrivo.')}
                style={{
                  width: '100%',
                  height: '48px',
                  background: '#000',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFF">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continua con Apple
              </button>

              <button
                type="button"
                onClick={() => setMessage('Accesso con Google in arrivo.')}
                style={{
                  width: '100%',
                  height: '48px',
                  background: '#FFF',
                  color: '#000',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continua con Google
              </button>
            </div>
          </div>

          {/* Privacy footer */}
          <p
            style={{
              fontSize: '11px',
              color: '#8E8E93',
              textAlign: 'center',
              margin: '18px 16px 0',
              lineHeight: 1.5,
            }}
          >
            Procedendo accetti i{' '}
            <a href="/terms" style={{ color: '#7CA982', textDecoration: 'none', fontWeight: 600 }}>
              Termini
            </a>
            {' '}e la{' '}
            <a href="/privacy" style={{ color: '#7CA982', textDecoration: 'none', fontWeight: 600 }}>
              Privacy Policy
            </a>
            {' '}di Fytra.
          </p>
        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
