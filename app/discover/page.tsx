"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import BottomNav from '@/app/components/BottomNav'

type UserProfile = {
  id: string
  username: string | null
  full_name: string | null
  goal: string | null
  bio: string | null
  avatar_url: string | null
  followers_count: number
  posts_count: number
}

type TrendingPost = {
  id: string
  user_id: string
  type: string
  meal_photo_url: string | null
  workout_type: string | null
  workout_distance_km: number | null
  workout_duration_min: number | null
  likes_count: number
  created_at: string
  profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | null
}

type TabView = 'suggeriti' | 'trending' | 'challenge'

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabView>('suggeriti')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [suggested, setSuggested] = useState<UserProfile[]>([])
  const [trending, setTrending] = useState<TrendingPost[]>([])
  const [searching, setSearching] = useState(false)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    loadData()
    loadFollowing()
  }, [user])

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, goal, bio, avatar_url, followers_count, posts_count')
        .or('username.ilike.%' + query + '%,full_name.ilike.%' + query + '%')
        .neq('id', user?.id || '')
        .limit(15)
      setSearchResults((data || []) as any)
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, user])

  const loadFollowing = async () => {
    if (!user) return
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user!.id)
    if (data) setFollowingIds(new Set(data.map(f => f.following_id)))
  }

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, full_name, goal, bio, avatar_url, followers_count, posts_count')
      .neq('id', user!.id)
      .not('username', 'is', null)
      .order('followers_count', { ascending: false })
      .limit(20)
    if (users) setSuggested(users as any)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: posts } = await supabase
      .from('posts')
      .select('id, user_id, type, meal_photo_url, workout_type, workout_distance_km, workout_duration_min, likes_count, created_at, profiles!posts_user_id_profiles_fkey(username, full_name, avatar_url)')
      .eq('is_private', false)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('likes_count', { ascending: false })
      .limit(30)
    if (posts) setTrending(posts as any)

    setLoading(false)
  }

  const toggleFollow = async (profileId: string) => {
    if (!user) return
    const isFollowing = followingIds.has(profileId)
    const newSet = new Set(followingIds)

    if (isFollowing) {
      newSet.delete(profileId)
      setFollowingIds(newSet)
      await supabase.from('follows').delete().eq('follower_id', user!.id).eq('following_id', profileId)
    } else {
      newSet.add(profileId)
      setFollowingIds(newSet)
      const { error } = await supabase.from('follows').insert({ follower_id: user!.id, following_id: profileId })
      if (error) {
        const rollback = new Set(followingIds)
        rollback.delete(profileId)
        setFollowingIds(rollback)
      }
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
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Scopri
          </h1>

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
              placeholder="Cerca utenti"
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
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Cancella"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(60,60,67,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
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
              {[
                { key: 'suggeriti' as TabView, label: 'Suggeriti' },
                { key: 'trending' as TabView, label: 'Trending' },
                { key: 'challenge' as TabView, label: 'Challenge' },
              ].map(t => {
                const active = tab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
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
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}
        </header>

        <main style={{ padding: '16px', paddingBottom: '100px' }}>
          {query && (
            <SearchResults
              results={searchResults}
              searching={searching}
              query={query}
              router={router}
              followingIds={followingIds}
              onToggleFollow={toggleFollow}
            />
          )}

          {!query && loading && <LoadingSkeleton />}

          {!query && !loading && tab === 'suggeriti' && (
            <SuggestedTab
              users={suggested}
              router={router}
              followingIds={followingIds}
              onToggleFollow={toggleFollow}
            />
          )}

          {!query && !loading && tab === 'trending' && <TrendingTab posts={trending} router={router} />}

          {!query && !loading && tab === 'challenge' && <ChallengeTab router={router} />}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

function SearchResults({
  results,
  searching,
  query,
  router,
  followingIds,
  onToggleFollow,
}: {
  results: UserProfile[]
  searching: boolean
  query: string
  router: ReturnType<typeof useRouter>
  followingIds: Set<string>
  onToggleFollow: (id: string) => void
}) {
  if (searching && results.length === 0) {
    return <p style={{ fontSize: '13px', color: '#8E8E93', textAlign: 'center', padding: '20px' }}>Ricerca...</p>
  }

  if (!searching && results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>Nessun risultato</p>
        <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 0' }}>Per "{query}"</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {results.map(u => (
        <UserRow key={u.id} user={u} router={router} isFollowing={followingIds.has(u.id)} onToggleFollow={onToggleFollow} />
      ))}
    </div>
  )
}

function SuggestedTab({
  users,
  router,
  followingIds,
  onToggleFollow,
}: {
  users: UserProfile[]
  router: ReturnType<typeof useRouter>
  followingIds: Set<string>
  onToggleFollow: (id: string) => void
}) {
  if (users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>Pochi utenti per ora</p>
        <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 0' }}>Invita i tuoi amici per far crescere la community.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #7CA982, #5B8C7B)',
          borderRadius: '16px',
          padding: '14px',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 14px rgba(124, 169, 130, 0.25)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Invita i tuoi amici</p>
          <p style={{ fontSize: '11px', opacity: 0.9, margin: '2px 0 0' }}>Il feed migliora con persone che conosci.</p>
        </div>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'Fytra', text: 'Unisciti a me su Fytra', url: window.location.origin })
            } else {
              navigator.clipboard.writeText(window.location.origin)
              alert('Link copiato')
            }
          }}
          style={{
            padding: '7px 14px',
            background: '#FFF',
            color: '#4F7057',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Invita
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.map(u => (
          <UserRow key={u.id} user={u} router={router} isFollowing={followingIds.has(u.id)} onToggleFollow={onToggleFollow} />
        ))}
      </div>
    </div>
  )
}

function TrendingTab({ posts, router }: { posts: TrendingPost[]; router: ReturnType<typeof useRouter> }) {
  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>Nessun post questa settimana</p>
        <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 0' }}>Torna presto.</p>
      </div>
    )
  }

  const mealPosts = posts.filter(p => p.type === 'pasto' && p.meal_photo_url)
  const workoutPosts = posts.filter(p => p.type === 'allenamento')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {mealPosts.length > 0 && (
        <>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '0 4px' }}>
            Pasti pi{'\u00F9'} apprezzati
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            {mealPosts.slice(0, 9).map(p => (
              <div
                key={p.id}
                onClick={() => router.push('/post/' + p.id)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <img src={p.meal_photo_url!} alt="Pasto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {p.likes_count > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      padding: '2px 6px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#FFF',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFF">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {p.likes_count}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {workoutPosts.length > 0 && (
        <>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: '0 4px' }}>Allenamenti top</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {workoutPosts.slice(0, 8).map(p => (
              <div
                key={p.id}
                onClick={() => router.push('/post/' + p.id)}
                style={{
                  background: '#FFF',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: '#7CA982',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 6.5h11v11h-11zM9.5 9.5h5v5h-5z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: 0, textTransform: 'capitalize' }}>
                    {p.workout_type || 'Allenamento'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#8E8E93', margin: '2px 0 0' }}>
                    @{p.profiles?.username || 'utente'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {p.workout_distance_km && (
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#7CA982', margin: 0 }}>
                      {p.workout_distance_km.toFixed(1)} km
                    </p>
                  )}
                  {!p.workout_distance_km && p.workout_duration_min && (
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#7CA982', margin: 0 }}>
                      {p.workout_duration_min} min
                    </p>
                  )}
                  {p.likes_count > 0 && (
                    <p style={{ fontSize: '10px', color: '#8E8E93', margin: '2px 0 0' }}>{p.likes_count} like</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ChallengeTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const challenges = [
    { id: 'oct-5k', title: 'Corri 5 km', subtitle: 'Questa settimana', emoji: '\uD83C\uDFC3', color: '#7CA982', bgColor: 'rgba(124, 169, 130, 0.12)', participants: 142, ends: '3 giorni' },
    { id: 'hydration', title: 'Idratazione 7 giorni', subtitle: 'Serie', emoji: '\uD83D\uDCA7', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)', participants: 89, ends: '6 giorni' },
    { id: 'veggie', title: 'Mangia verde', subtitle: 'Per 5 giorni', emoji: '\uD83E\uDD66', color: '#30D158', bgColor: 'rgba(48, 209, 88, 0.1)', participants: 67, ends: '5 giorni' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #D17A3C, #E8A857)',
          borderRadius: '16px',
          padding: '16px',
          color: '#FFF',
          boxShadow: '0 4px 14px rgba(209, 122, 60, 0.25)',
        }}
      >
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', margin: 0, opacity: 0.95 }}>
          SFIDE DELLA SETTIMANA
        </p>
        <p style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0', letterSpacing: '-0.3px' }}>
          Partecipa, vinci badge
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {challenges.map(c => (
          <div key={c.id} style={{ background: '#FFF', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: c.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              <span>{c.emoji}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: 0 }}>{c.title}</p>
              <p style={{ fontSize: '11px', color: '#8E8E93', margin: '2px 0 0' }}>
                {c.participants} partecipanti {'\u2022'} {c.ends}
              </p>
            </div>
            <button
              onClick={() => router.push('/new-post')}
              style={{
                padding: '6px 12px',
                background: c.color,
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Partecipa
            </button>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '11px', color: '#8E8E93', textAlign: 'center', margin: '4px 0 0' }}>
        Sfide in beta. Partecipanti indicativi.
      </p>
    </div>
  )
}

function UserRow({
  user,
  router,
  isFollowing,
  onToggleFollow,
}: {
  user: UserProfile
  router: ReturnType<typeof useRouter>
  isFollowing: boolean
  onToggleFollow: (id: string) => void
}) {
  const username = user.username || 'utente'
  const avatar = getAvatarColor(username)

  return (
    <div
      style={{
        background: '#FFF',
        borderRadius: '12px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        onClick={() => router.push('/profile/' + user!.id)}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: user.avatar_url ? 'transparent' : avatar.bg,
          color: avatar.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 700,
          flexShrink: 0,
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          username[0].toUpperCase()
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push('/profile/' + user!.id)}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.full_name || username}
        </p>
        <p style={{ fontSize: '12px', color: '#8E8E93', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          @{username}
          {user.goal && <span> {'\u2022'} {goalShort(user.goal)}</span>}
        </p>
      </div>
      <button
        onClick={() => onToggleFollow(user!.id)}
        style={{
          padding: '6px 14px',
          background: isFollowing ? '#F2F2F7' : '#7CA982',
          color: isFollowing ? '#000' : '#FFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {isFollowing ? 'Seguito' : 'Segui'}
      </button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{ background: '#FFF', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'center' }}
          className="animate-pulse"
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#E5E5EA' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '12px', width: '40%', background: '#E5E5EA', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ height: '10px', width: '60%', background: '#E5E5EA', borderRadius: '4px' }} />
          </div>
          <div style={{ width: '60px', height: '28px', borderRadius: '8px', background: '#E5E5EA' }} />
        </div>
      ))}
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

function goalShort(g: string): string {
  const map: Record<string, string> = {
    asciugarsi: 'Dimagrire',
    massa: 'Massa',
    mantenimento: 'Mantieni',
    salute: 'Salute',
  }
  return map[g] || g
}
