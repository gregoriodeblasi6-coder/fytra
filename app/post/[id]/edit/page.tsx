"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

type Post = {
  id: string
  user_id: string
  type: string
  is_private: boolean
  meal_description: string | null
  meal_type: string | null
  workout_notes: string | null
  created_at: string
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const postId = params?.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notAllowed, setNotAllowed] = useState(false)

  const [caption, setCaption] = useState('')
  const [mealType, setMealType] = useState<string>('pranzo')
  const [customDate, setCustomDate] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    loadPost()
  }, [postId, user, authLoading])

  const loadPost = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()

    if (!data) {
      setNotAllowed(true)
      setLoading(false)
      return
    }

    // Solo il proprietario puo' modificare
    if (data.user_id !== user?.id) {
      setNotAllowed(true)
      setLoading(false)
      return
    }

    setPost(data)
    setCaption(data.type === 'pasto' ? (data.meal_description || '') : (data.workout_notes || ''))
    setMealType(data.meal_type || 'pranzo')
    setIsPrivate(data.is_private)

    // Formatta data per datetime-local
    const d = new Date(data.created_at)
    const pad = (n: number) => String(n).padStart(2, '0')
    setCustomDate(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()))

    setLoading(false)
  }

  const handleSave = async () => {
    if (!post) return
    setSaving(true)
    setError('')

    // Validate data non futura
    const picked = new Date(customDate)
    const now = new Date()
    if (picked.getTime() > now.getTime() + 60000) {
      setError('La data non puo essere nel futuro.')
      setSaving(false)
      return
    }

    const updateData: any = {
      is_private: isPrivate,
      created_at: picked.toISOString(),
    }

    if (post.type === 'pasto') {
      updateData.meal_description = caption.trim() || null
      updateData.meal_type = mealType
    } else {
      updateData.workout_notes = caption.trim() || null
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', post.id)

    if (updateError) {
      setError('Errore salvataggio: ' + updateError.message)
      setSaving(false)
    } else {
      router.push('/post/' + post.id)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #E5E5EA', borderTopColor: '#7CA982', animation: 'spin 0.8s linear infinite' }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  if (notAllowed) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#000' }}>Non puoi modificare questo post</p>
        <p style={{ fontSize: '13px', color: '#8E8E93', margin: '6px 0 14px' }}>Solo il proprietario puo modificarlo.</p>
        <button
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            background: '#7CA982',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Indietro
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F7' }}>
      <div
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          minHeight: '100vh',
          background: '#F2F2F7',
          boxShadow: '0 0 40px rgba(0,0,0,0.06)',
        }}
      >
        <header
          style={{
            background: 'rgba(242, 242, 247, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '10px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '15px', cursor: 'pointer', padding: '8px 0' }}
          >
            Annulla
          </button>
          <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Modifica post</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'none',
              border: 'none',
              color: saving ? '#C7C7CC' : '#007AFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              padding: '8px 0',
            }}
          >
            {saving ? 'Salvo...' : 'Salva'}
          </button>
        </header>

        <main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '40px' }}>
          <div
            style={{
              background: 'rgba(232, 168, 87, 0.1)',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#8B5A1B',
              lineHeight: 1.4,
            }}
          >
            Puoi modificare solo descrizione, data/ora e privacy. Per modificare ingredienti, foto o stats, elimina il post e creane uno nuovo.
          </div>

          {/* Caption */}
          <div style={{ background: '#FFF', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Descrizione
            </label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={post?.type === 'pasto' ? 'Racconta qualcosa del tuo pasto' : 'Aggiungi note sull allenamento'}
              rows={4}
              style={{
                width: '100%',
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: '#000',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '60px',
              }}
            />
          </div>

          {/* Tipo pasto (solo se pasto) */}
          {post?.type === 'pasto' && (
            <div style={{ background: '#FFF', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Tipo pasto
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {['colazione', 'pranzo', 'cena', 'spuntino'].map(t => {
                  const active = mealType === t
                  return (
                    <button
                      key={t}
                      onClick={() => setMealType(t)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        background: active ? 'rgba(209, 122, 60, 0.15)' : '#F2F2F7',
                        border: active ? '1.5px solid #D17A3C' : '1.5px solid transparent',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: active ? 700 : 500,
                        color: active ? '#B85A1F' : '#3C3C43',
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Data e ora */}
          <div style={{ background: '#FFF', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Data e ora
            </label>
            <input
              type="datetime-local"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#F2F2F7',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#000',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Privacy */}
          <div style={{ background: '#FFF', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>
                {isPrivate ? 'Post privato' : 'Post pubblico'}
              </p>
              <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>
                {isPrivate ? 'Visibile solo a te' : 'Visibile nella community'}
              </p>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              style={{
                width: '50px',
                height: '30px',
                borderRadius: '15px',
                background: isPrivate ? '#E5E5EA' : '#30D158',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: isPrivate ? '3px' : '23px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FFF',
                  transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.2)', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ fontSize: '13px', color: '#C53030', margin: 0 }}>{error}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
