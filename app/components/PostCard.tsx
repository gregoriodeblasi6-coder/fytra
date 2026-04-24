"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import MealPostBody from './MealPostBody'

export type PostData = {
  id: string
  user_id: string
  type: string
  is_private: boolean
  meal_description: string | null
  meal_photo_url: string | null
  meal_type: string | null
  workout_type: string | null
  workout_duration_min: number | null
  workout_distance_km: number | null
  workout_notes: string | null
  workout_speed_kmh: number | null
  workout_heartrate: number | null
  likes_count: number
  comments_count: number
  created_at: string
  profiles: {
    id?: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function PostCard({
  post,
  currentUserId,
  onCommentClick,
  clickable = true,
  mealMode = 'preview',
}: {
  post: PostData
  currentUserId: string
  onCommentClick?: () => void
  clickable?: boolean
  mealMode?: 'preview' | 'full'
}) {
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showLikesList, setShowLikesList] = useState(false)

  useEffect(() => {
    if (!currentUserId) return
    checkIfLiked()
  }, [post.id, currentUserId])

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUserId)
      .maybeSingle()
    setLiked(!!data)
  }

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likeLoading) return
    setLikeLoading(true)

    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked)
    setLikesCount(c => (newLiked ? c + 1 : Math.max(c - 1, 0)))

    if (newLiked) {
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId })
      if (error) {
        setLiked(false)
        setLikesCount(c => Math.max(c - 1, 0))
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
      if (error) {
        setLiked(true)
        setLikesCount(c => c + 1)
      }
    }
    setLikeLoading(false)
  }

  const sharePost = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = window.location.origin + '/post/' + post.id
    const text = post.type === 'pasto' ? 'Guarda questo pasto su Fytra' : 'Guarda questo allenamento su Fytra'

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Fytra', text, url })
      } catch {
        // utente annulla
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copiato negli appunti')
      } catch {
        alert(url)
      }
    }
  }

  const deletePost = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Sei sicuro di voler eliminare questo post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (!error) {
      window.location.reload()
    }
  }

  const goToPost = () => {
    if (clickable) router.push('/post/' + post.id)
  }

  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (post.profiles?.id && post.profiles.id !== currentUserId) {
      router.push('/profile/' + post.profiles.id)
    } else {
      router.push('/profile')
    }
  }

  const username = post.profiles?.username || 'utente'
  const fullName = post.profiles?.full_name || username
  const avatar = getAvatarColor(username)
  const timeAgo = formatTimeAgo(post.created_at)
  const isOwnPost = post.user_id === currentUserId

  return (
    <article
      style={{
        background: '#FFF',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: clickable ? 'pointer' : 'default',
      }}
      onClick={goToPost}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px 10px', gap: '10px' }}>
        <button
          onClick={goToProfile}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: post.profiles?.avatar_url ? 'transparent' : avatar.bg,
            color: avatar.text,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 700,
            flexShrink: 0,
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            username[0].toUpperCase()
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={goToProfile}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fullName}
          </p>
          <p style={{ fontSize: '11px', color: '#8E8E93', margin: '1px 0 0' }}>
            @{username} {'\u2022'} {timeAgo}
          </p>
        </div>

        {/* Tipo badge */}
        {/* Tipo specifico mostrato nel body del post, non nell'header */}

        {/* Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(!showMenu) }}
            aria-label="Menu"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
          {showMenu && (
            <>
              <div
                onClick={e => { e.stopPropagation(); setShowMenu(false) }}
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
              />
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '30px',
                  right: 0,
                  background: '#FFF',
                  borderRadius: '10px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  zIndex: 51,
                  minWidth: '170px',
                }}
              >
                <MenuItem label="Condividi" onClick={e => { sharePost(e); setShowMenu(false) }} />
                <MenuItem label="Copia link" onClick={async e => {
                  e.stopPropagation()
                  await navigator.clipboard.writeText(window.location.origin + '/post/' + post.id)
                  alert('Link copiato')
                  setShowMenu(false)
                }} />
                {isOwnPost && <MenuItem label="Modifica post" onClick={e => {
                  e.stopPropagation()
                  setShowMenu(false)
                  router.push('/post/' + post.id + '/edit')
                }} />}
                {isOwnPost && <MenuItem label="Elimina post" onClick={deletePost} danger />}
                {!isOwnPost && <MenuItem label="Segnala" onClick={e => { e.stopPropagation(); alert('Grazie, ce ne occuperemo.'); setShowMenu(false) }} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* BODY */}
      {post.type === 'pasto' ? (
        <MealPostBody post={post} mode={mealMode} isOwner={isOwnPost} />
      ) : post.type === 'allenamento' ? (
        <WorkoutPostBody post={post} />
      ) : (
        <div style={{ padding: '0 14px 12px', fontSize: '14px', color: '#000', lineHeight: 1.5 }}>
          {post.meal_description || post.workout_notes}
        </div>
      )}

      {/* ACTIONS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 10px',
          borderTop: '0.5px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Like icon */}
          <button
            onClick={toggleLike}
            aria-label="Mi piace"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px 6px 10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? '#FF3B30' : 'none'} stroke={liked ? '#FF3B30' : '#3C3C43'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Like count cliccabile → apre lista */}
          {likesCount > 0 && (
            <button
              onClick={e => {
                e.stopPropagation()
                setShowLikesList(true)
              }}
              style={{
                padding: '6px 6px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: liked ? '#FF3B30' : '#3C3C43',
                marginRight: '6px',
              }}
            >
              {likesCount}
            </button>
          )}

          {/* Comment */}
          <ActionBtn
            onClick={e => {
              e.stopPropagation()
              if (onCommentClick) {
                onCommentClick()
              } else {
                router.push('/post/' + post.id)
              }
            }}
            active={false}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            }
            count={post.comments_count || 0}
          />

          {/* Share */}
          <ActionBtn
            onClick={sharePost}
            active={false}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            }
          />
        </div>

        {post.is_private && (
          <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Privato
          </span>
        )}
      </div>

      {/* Likes list modal */}
      {showLikesList && (
        <LikesListModal
          postId={post.id}
          onClose={() => setShowLikesList(false)}
          onUserClick={userId => {
            setShowLikesList(false)
            if (userId === currentUserId) {
              router.push('/profile')
            } else {
              router.push('/profile/' + userId)
            }
          }}
        />
      )}
    </article>
  )
}

/* ============ LIKES LIST MODAL ============ */
function LikesListModal({
  postId,
  onClose,
  onUserClick,
}: {
  postId: string
  onClose: () => void
  onUserClick: (userId: string) => void
}) {
  const [users, setUsers] = useState<Array<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLikers()
  }, [postId])

  const loadLikers = async () => {
    const { data } = await supabase
      .from('likes')
      .select('profiles!likes_user_id_profiles_fkey(id, username, full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (data) {
      const profiles = data
        .map((r: any) => r.profiles)
        .filter(Boolean)
      setUsers(profiles as any)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#F2F2F7',
          width: '100%',
          maxWidth: '430px',
          maxHeight: '70vh',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '10px 16px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.2)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
            Mi piace {users.length > 0 && <span style={{ color: '#8E8E93', fontWeight: 500 }}>({users.length})</span>}
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <p style={{ textAlign: 'center', padding: '30px', color: '#8E8E93', fontSize: '13px' }}>Caricamento...</p>
          )}
          {!loading && users.length === 0 && (
            <p style={{ textAlign: 'center', padding: '30px', color: '#8E8E93', fontSize: '13px' }}>Nessun like ancora.</p>
          )}
          {!loading && users.map(u => {
            const username = u.username || 'utente'
            const avatar = getAvatarColor(username)
            return (
              <button
                key={u.id}
                onClick={() => onUserClick(u.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: u.avatar_url ? 'transparent' : avatar.bg,
                    color: avatar.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    username[0].toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>{u.full_name || username}</p>
                  <p style={{ fontSize: '12px', color: '#8E8E93', margin: '1px 0 0' }}>@{username}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ============ WORKOUT BODY ============ */
function WorkoutPostBody({ post }: { post: PostData }) {
  const stats = [
    post.workout_duration_min && { label: 'DURATA', value: formatDuration(post.workout_duration_min), color: '#7CA982' },
    post.workout_distance_km && { label: 'DISTANZA', value: post.workout_distance_km.toFixed(1) + ' km', color: '#3B82F6' },
    post.workout_speed_kmh && { label: 'VELOCITA', value: post.workout_speed_kmh.toFixed(1), color: '#8B5CF6', suffix: 'km/h' },
    post.workout_heartrate && { label: 'BPM', value: String(post.workout_heartrate), color: '#FF3B30' },
  ].filter(Boolean) as Array<{ label: string; value: string; color: string; suffix?: string }>

  const title = (post.workout_type || 'Sessione').charAt(0).toUpperCase() + (post.workout_type || 'Sessione').slice(1)

  return (
    <div style={{ padding: '12px 14px 12px' }}>
      {/* Header: icona + titolo + (se presente) prima riga descrizione */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: post.workout_notes || stats.length > 0 ? '12px' : 0 }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(124, 169, 130, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F7057" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11v11h-11z" />
            <path d="M9.5 9.5h5v5h-5z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#000', margin: 0 }}>{title}</p>
          {post.workout_notes && (
            <p
              style={{
                fontSize: '12px',
                color: '#8E8E93',
                margin: '2px 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {post.workout_notes}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      {stats.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(' + Math.min(stats.length, 4) + ', 1fr)',
            gap: '6px',
          }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{ background: '#F2F2F7', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: s.color, letterSpacing: '0.5px', margin: 0 }}>
                {s.label}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '3px 0 0' }}>
                {s.value}
                {s.suffix && <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 500, marginLeft: '2px' }}>{s.suffix}</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return minutes + 'min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return h + 'h'
  return h + 'h' + m
}

/* ============ SMALL UI ============ */

function TypeBadge({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 700,
        padding: '3px 7px',
        borderRadius: '6px',
        background: bg,
        color,
        letterSpacing: '0.4px',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

function ActionBtn({
  onClick,
  active,
  icon,
  count,
  activeColor,
}: {
  onClick: (e: React.MouseEvent) => void
  active: boolean
  icon: React.ReactNode
  count?: number
  activeColor?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 10px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '8px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {typeof count === 'number' && count > 0 && (
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: active && activeColor ? activeColor : '#3C3C43',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '12px 16px',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '14px',
        color: danger ? '#FF3B30' : '#000',
        fontWeight: 500,
        borderBottom: '0.5px solid rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  )
}

/* ============ HELPERS ============ */

function getAvatarColor(name: string) {
  const palette = [
    { bg: '#7CA982', text: '#FFFFFF' },
    { bg: '#D17A3C', text: '#FFFFFF' },
    { bg: '#E8A857', text: '#1F2421' },
    { bg: '#5B8C7B', text: '#FFFFFF' },
    { bg: '#C96F4A', text: '#FFFFFF' },
    { bg: '#6B8E7F', text: '#FFFFFF' },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'ora'
  if (diff < 3600) return Math.floor(diff / 60) + 'min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  if (diff < 604800) return Math.floor(diff / 86400) + 'g'
  if (diff < 2592000) return Math.floor(diff / 604800) + 'sett'
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}
