"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import PostCard, { PostData } from '@/app/components/PostCard'
import CommentsSheet from '@/app/components/CommentsSheet'

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const postId = params?.id as string

  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    loadPost()
  }, [postId, user])

  const loadPost = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(id, username, full_name, avatar_url)')
      .eq('id', postId)
      .maybeSingle()

    if (error || !data) {
      setNotFound(true)
    } else {
      setPost(data as any)
    }
    setLoading(false)
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
        {/* HEADER */}
        <header
          style={{
            background: 'rgba(242, 242, 247, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '12px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
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
          <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0, flex: 1 }}>Post</h1>
        </header>

        <main style={{ padding: '12px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
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

          {notFound && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>Post non trovato</p>
              <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 14px' }}>
                Potrebbe essere stato eliminato.
              </p>
              <button
                onClick={() => router.push('/feed')}
                style={{
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
                Torna al feed
              </button>
            </div>
          )}

          {post && !loading && (
            <>
              <PostCard
                post={post}
                currentUserId={user?.id || ''}
                onCommentClick={() => setShowComments(true)}
                clickable={false}
              />

              <button
                onClick={() => setShowComments(true)}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '14px',
                  background: '#FFF',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#7CA982',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7CA982" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                {post.comments_count > 0 ? 'Vedi i ' + post.comments_count + ' commenti' : 'Lascia un commento'}
              </button>
            </>
          )}
        </main>
      </div>

      {showComments && post && (
        <CommentsSheet
          postId={post.id}
          currentUserId={user?.id || ''}
          onClose={() => {
            setShowComments(false)
            loadPost()
          }}
        />
      )}
    </div>
  )
}
