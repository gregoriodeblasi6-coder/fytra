"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import BottomNav from '@/app/components/BottomNav'
import PostCard, { PostData } from '@/app/components/PostCard'
import CommentsSheet from '@/app/components/CommentsSheet'

type FilterType = 'tutti' | 'pasti' | 'allenamenti' | 'seguiti'

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('tutti')
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [commentPostId, setCommentPostId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadFollowing().then(ids => {
        // Al primo caricamento, se l'utente segue qualcuno, default su "Seguiti"
        const wantedFilter: FilterType = (initialLoad && ids.length > 0) ? 'seguiti' : filter
        if (initialLoad && ids.length > 0) {
          setFilter('seguiti')
        }
        setInitialLoad(false)
        // Passo esplicitamente il filter desiderato per evitare race con setState async
        loadPosts(ids, wantedFilter)
      })
      loadUnreadCount()
    }
  }, [user])

  useEffect(() => {
    if (user && !initialLoad) {
      loadPosts(followingIds, filter)
    }
  }, [filter])

  const loadFollowing = async (): Promise<string[]> => {
    if (!user) return []
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user!.id)
    const ids = data ? data.map(f => f.following_id) : []
    setFollowingIds(ids)
    return ids
  }

  const loadPosts = async (currentFollowingIds?: string[], currentFilter?: FilterType) => {
    if (!user) return
    setLoading(true)
    const followIds = currentFollowingIds ?? followingIds
    const f = currentFilter ?? filter

    let query = supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(id, username, full_name, avatar_url)')
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (f === 'pasti') query = query.eq('type', 'pasto')
    if (f === 'allenamenti') query = query.eq('type', 'allenamento')

    const { data } = await query
    let filtered = (data as any) || []

    if (f === 'seguiti') {
      filtered = filtered.filter((p: PostData) => followIds.includes(p.user_id) || p.user_id === user!.id)
    }

    setPosts(filtered)
    setLoading(false)
  }

  const loadUnreadCount = async () => {
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('read', false)
    setUnreadNotifs(count || 0)
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
        {/* HEADER */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#000',
                  margin: 0,
                  letterSpacing: '-0.5px',
                  fontFamily: 'Georgia, serif',
                }}
              >
                Fytra
              </h1>
            </div>
            <button
              onClick={() => router.push('/notifications')}
              aria-label="Notifiche"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(118, 118, 128, 0.1)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2421" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifs > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#FF3B30',
                    color: '#FFF',
                    fontSize: '9px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    border: '1.5px solid #F2F2F7',
                    boxSizing: 'content-box',
                  }}
                >
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          </div>

          {/* Filtro */}
          <div
            style={{
              background: 'rgba(118, 118, 128, 0.12)',
              borderRadius: '9px',
              padding: '2px',
              display: 'flex',
            }}
          >
            {[
              { key: 'tutti' as FilterType, label: 'Tutti' },
              { key: 'seguiti' as FilterType, label: 'Seguiti' },
              { key: 'pasti' as FilterType, label: 'Pasti' },
              { key: 'allenamenti' as FilterType, label: 'Workout' },
            ].map(t => {
              const active = filter === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  style={{
                    flex: 1,
                    padding: '6px 6px',
                    fontSize: '12px',
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
        </header>

        {/* MAIN */}
        <main style={{ padding: '12px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid #E5E5EA',
                  borderTopColor: '#7CA982',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto',
                }}
              />
              <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '20px',
                  background: 'rgba(124, 169, 130, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7CA982" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>
                {filter === 'seguiti' ? 'Nessun post dai seguiti' : 'Ancora nessun post'}
              </p>
              <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 14px' }}>
                {filter === 'seguiti' ? 'Segui altre persone o cambia filtro.' : 'Sii il primo a condividere qualcosa.'}
              </p>
              <button
                onClick={() => router.push(filter === 'seguiti' ? '/discover' : '/new-post')}
                style={{
                  padding: '10px 24px',
                  background: '#7CA982',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(124, 169, 130, 0.3)',
                }}
              >
                {filter === 'seguiti' ? 'Scopri persone' : 'Crea il primo post'}
              </button>
            </div>
          )}

          {!loading && posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id || ''}
              onCommentClick={() => setCommentPostId(post.id)}
            />
          ))}
        </main>

        <BottomNav />
      </div>

      {commentPostId && (
        <CommentsSheet
          postId={commentPostId}
          currentUserId={user?.id || ''}
          onClose={() => {
            setCommentPostId(null)
            loadPosts()
          }}
        />
      )}
    </div>
  )
}
