"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import PostCard, { PostData } from '@/app/components/PostCard'
import CommentsSheet from '@/app/components/CommentsSheet'
import BottomNav from '@/app/components/BottomNav'

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
  goal: string | null
  bio: string | null
  avatar_url: string | null
  followers_count: number
  following_count: number
  posts_count: number
  is_private: boolean
}

export default function OtherProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const profileId = params?.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [tab, setTab] = useState<'posts' | 'info'>('posts')
  const [commentPostId, setCommentPostId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    if (profileId === user.id) {
      router.replace('/profile')
      return
    }
    loadData()
  }, [profileId, user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', profileId).maybeSingle()
    if (p) setProfile(p as any)

    const { data: ps } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(id, username, full_name, avatar_url)')
      .eq('user_id', profileId)
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(50)
    if (ps) setPosts(ps as any)

    const { data: followCheck } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .maybeSingle()
    setIsFollowing(!!followCheck)

    setLoading(false)
  }

  const toggleFollow = async () => {
    if (!user || !profile || followLoading) return
    setFollowLoading(true)

    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)

    if (!wasFollowing) {
      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profile.id,
      })
      if (!error) {
        setProfile({ ...profile, followers_count: profile.followers_count + 1 })
      } else {
        setIsFollowing(false)
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
      if (!error) {
        setProfile({ ...profile, followers_count: Math.max(profile.followers_count - 1, 0) })
      } else {
        setIsFollowing(true)
      }
    }
    setFollowLoading(false)
  }

  const openMessage = () => {
    alert('Chat tra utenti in arrivo')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid #E5E5EA',
            borderTopColor: '#7CA982',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#000' }}>Utente non trovato</p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: '14px',
            padding: '10px 24px',
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

  const username = profile.username || 'utente'
  const fullName = profile.full_name || username
  const avatar = getAvatarColor(username)

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
            padding: '12px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            borderBottom: '0.5px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={() => router.back()}
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
          <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0, flex: 1 }}>@{username}</h1>
        </header>

        <main style={{ paddingBottom: '100px' }}>
          {/* Profile header */}
          <div style={{ padding: '20px 20px 14px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: profile.avatar_url ? 'transparent' : avatar.bg,
                  color: avatar.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 700,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  username[0].toUpperCase()
                )}
              </div>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#000', margin: 0, letterSpacing: '-0.3px' }}>
              {fullName}
            </h2>
            <p style={{ fontSize: '14px', color: '#8E8E93', margin: '2px 0 0' }}>@{username}</p>

            {profile.goal && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '10px',
                  padding: '5px 12px',
                  background: 'rgba(124, 169, 130, 0.15)',
                  borderRadius: '16px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7CA982' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4F7057' }}>{goalLabel(profile.goal)}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: isFollowing ? '#F2F2F7' : '#7CA982',
                  color: isFollowing ? '#000' : '#FFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: isFollowing ? 'none' : '0 2px 8px rgba(124, 169, 130, 0.3)',
                  minWidth: '120px',
                }}
              >
                {followLoading ? '...' : isFollowing ? 'Seguito' : 'Segui'}
              </button>
              <button
                onClick={openMessage}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: '#FFF',
                  color: '#000',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Messaggio
              </button>
            </div>
          </div>

          {/* Social stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              margin: '0 20px 16px',
              background: '#FFF',
              borderRadius: '14px',
              padding: '14px 10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <SocialStat value={profile.posts_count || 0} label="Post" />
            <Divider />
            <SocialStat value={profile.followers_count || 0} label="Follower" />
            <Divider />
            <SocialStat value={profile.following_count || 0} label="Seguiti" />
          </div>

          {/* Bio */}
          {profile.bio && (
            <div style={{ padding: '0 20px 14px' }}>
              <div
                style={{
                  background: '#FFF',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <p style={{ fontSize: '13px', color: '#3C3C43', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {profile.bio}
                </p>
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <div style={{ padding: '0 20px 14px' }}>
            <div
              style={{
                background: 'rgba(118, 118, 128, 0.12)',
                borderRadius: '10px',
                padding: '2px',
                display: 'flex',
              }}
            >
              <button
                onClick={() => setTab('posts')}
                style={tabBtnStyle(tab === 'posts')}
              >
                Post
              </button>
              <button
                onClick={() => setTab('info')}
                style={tabBtnStyle(tab === 'info')}
              >
                Info
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '0 12px' }}>
            {tab === 'posts' && (
              <>
                {posts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0 }}>
                      {profile.is_private && !isFollowing
                        ? 'Profilo privato. Segui per vedere i post.'
                        : 'Nessun post ancora.'}
                    </p>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {posts.map(p => (
                    <PostCard
                      key={p.id}
                      post={p}
                      currentUserId={user?.id || ''}
                      onCommentClick={() => setCommentPostId(p.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {tab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <InfoCard label="Obiettivo" value={profile.goal ? goalLabel(profile.goal) : '-'} />
                {profile.age && <InfoCard label={'Et\u00E0'} value={profile.age + ' anni'} />}
                {profile.weight_kg && <InfoCard label="Peso" value={profile.weight_kg + ' kg'} />}
                {profile.height_cm && <InfoCard label="Altezza" value={profile.height_cm + ' cm'} />}
                {!profile.age && !profile.weight_kg && !profile.height_cm && !profile.goal && (
                  <p style={{ fontSize: '13px', color: '#8E8E93', textAlign: 'center', padding: '20px' }}>
                    Nessuna info condivisa.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {commentPostId && (
        <CommentsSheet
          postId={commentPostId}
          currentUserId={user?.id || ''}
          onClose={() => setCommentPostId(null)}
        />
      )}
    </div>
  )
}

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '7px',
    fontSize: '13px',
    fontWeight: active ? 600 : 500,
    color: active ? '#000' : '#3C3C43',
    background: active ? '#FFF' : 'transparent',
    border: 'none',
    borderRadius: '8px',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    cursor: 'pointer',
  }
}

function Divider() {
  return <div style={{ width: '0.5px', background: 'rgba(0,0,0,0.1)' }} />
}

function SocialStat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#000', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '11px', color: '#8E8E93', margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: '#FFF',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontSize: '14px', color: '#3C3C43' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#000', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

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

function goalLabel(g: string) {
  const map: Record<string, string> = {
    asciugarsi: 'Perdere grasso',
    massa: 'Massa muscolare',
    mantenimento: 'Mantenimento',
    salute: 'Salute generale',
  }
  return map[g] || g
}
