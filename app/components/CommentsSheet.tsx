"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Comment = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  text: string
  likes_count: number
  created_at: string
  updated_at?: string | null
  profiles: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function CommentsSheet({
  postId,
  currentUserId,
  onClose,
}: {
  postId: string
  currentUserId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [sending, setSending] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  // Tag autocomplete (digitando @ apre dropdown utenti)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null }>>([])

  // Swipe to close
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const [dragOffsetY, setDragOffsetY] = useState(0)

  useEffect(() => {
    loadComments()
  }, [postId])

  // Scroll lock body sotto la modale — preserva scroll position
  useEffect(() => {
    const scrollY = window.scrollY
    const prevPosition = document.body.style.position
    const prevTop = document.body.style.top
    const prevWidth = document.body.style.width
    const prevOverflow = document.body.style.overflow

    // Tecnica iOS-safe: blocca scroll body via position fixed, ricorda scroll
    document.body.style.position = 'fixed'
    document.body.style.top = '-' + scrollY + 'px'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = prevPosition
      document.body.style.top = prevTop
      document.body.style.width = prevWidth
      document.body.style.overflow = prevOverflow
      // Ripristina la scroll position
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Swipe down handlers (touch on header drag bar)
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    const diff = e.touches[0].clientY - dragStartY.current
    if (diff > 0) {
      // Blocco il pull-to-refresh nativo del browser
      try { e.preventDefault() } catch {}
      setDragOffsetY(diff)
    }
  }
  const onTouchEnd = () => {
    if (dragOffsetY > 100) {
      onClose()
    }
    setDragOffsetY(0)
    dragStartY.current = null
  }

  // Mention autocomplete: rileva @ digitato
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setNewComment(v)

    // Cerca l'ultima occorrenza di @ non chiusa da spazio
    const m = v.match(/@(\w*)$/)
    if (m) {
      const q = m[1]
      setMentionQuery(q)
      if (q.length >= 1) searchMentions(q)
      else setMentionResults([])
    } else {
      setMentionQuery(null)
      setMentionResults([])
    }
  }

  const searchMentions = async (q: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .ilike('username', q + '%')
      .neq('id', currentUserId)
      .limit(5)
    setMentionResults((data as any) || [])
  }

  const insertMention = (username: string) => {
    // Sostituisce l'ultima @parola con @username (con spazio dopo)
    const newText = newComment.replace(/@\w*$/, '@' + username + ' ')
    setNewComment(newText)
    setMentionQuery(null)
    setMentionResults([])
    inputRef.current?.focus()
  }

  // Click su una @menzione → cerca user e naviga al profilo
  const handleMentionClick = async (username: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (data) {
      onClose()
      if (data.id === currentUserId) {
        router.push('/profile')
      } else {
        router.push('/profile/' + data.id)
      }
    }
  }

  // Modifica commento
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const startEdit = (c: Comment) => {
    setEditingCommentId(c.id)
    setEditText(c.text)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditText('')
  }

  const saveEdit = async () => {
    if (!editingCommentId || !editText.trim()) return
    const { error } = await supabase
      .from('comments')
      .update({ text: editText.trim(), updated_at: new Date().toISOString() })
      .eq('id', editingCommentId)
      .eq('user_id', currentUserId)

    if (!error) {
      setEditingCommentId(null)
      setEditText('')
      await loadComments()
    } else {
      alert('Errore modifica: ' + error.message)
    }
  }

  const loadComments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_id, user_id, parent_id, text, likes_count, created_at, updated_at, profiles!comments_user_id_profiles_fkey(id, username, full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error || !data) {
      setComments([])
      setLoading(false)
      return
    }

    setComments(data as any)

    if (currentUserId) {
      const ids = data.map(c => c.id)
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', currentUserId)
        .in('comment_id', ids)
      if (likes) setLikedIds(new Set(likes.map(l => l.comment_id)))
    }
    setLoading(false)
  }

  const sendComment = async () => {
    if (!newComment.trim() || sending) return
    setSending(true)

    // Logica risposte: parent_id sempre punta al root comment (mai a una risposta)
    // Se l'utente sta rispondendo a una risposta, prependo "@username " al testo
    // cosi' visivamente sai a chi rispondi, ma struttura DB resta a 2 livelli (root + risposte)
    let finalText = newComment.trim()
    let parentId: string | null = null

    if (replyTo) {
      // Se sto rispondendo a un root comment, parent_id = replyTo.id
      // Se sto rispondendo a una risposta, parent_id = replyTo.parent_id (il root)
      parentId = replyTo.parent_id || replyTo.id

      // Se rispondo a una risposta, prependo @username automaticamente (se non gia' presente)
      if (replyTo.parent_id) {
        const username = replyTo.profiles?.username
        if (username && !finalText.startsWith('@' + username)) {
          finalText = '@' + username + ' ' + finalText
        }
      }
    }

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUserId,
      parent_id: parentId,
      text: finalText,
    })

    if (!error) {
      setNewComment('')
      setReplyTo(null)
      await loadComments()
    } else {
      alert('Errore: ' + error.message)
    }
    setSending(false)
  }

  const toggleCommentLike = async (commentId: string) => {
    const already = likedIds.has(commentId)
    const newSet = new Set(likedIds)
    if (already) {
      newSet.delete(commentId)
      setLikedIds(newSet)
      setComments(comments.map(c => c.id === commentId ? { ...c, likes_count: Math.max(c.likes_count - 1, 0) } : c))
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserId)
    } else {
      newSet.add(commentId)
      setLikedIds(newSet)
      setComments(comments.map(c => c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c))
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUserId })
    }
  }

  const deleteComment = async (c: Comment) => {
    if (c.user_id !== currentUserId) return
    if (!confirm('Eliminare questo commento?')) return
    await supabase.from('comments').delete().eq('id', c.id)
    await loadComments()
  }

  // Raggruppa commenti root e risposte
  const rootComments = comments.filter(c => !c.parent_id)
  const replies = comments.filter(c => c.parent_id)
  const replyMap = new Map<string, Comment[]>()
  replies.forEach(r => {
    if (!r.parent_id) return
    if (!replyMap.has(r.parent_id)) replyMap.set(r.parent_id, [])
    replyMap.get(r.parent_id)!.push(r)
  })

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
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#F2F2F7',
          width: '100%',
          maxWidth: '430px',
          height: '85vh',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          transform: dragOffsetY > 0 ? 'translateY(' + dragOffsetY + 'px)' : 'none',
          transition: dragOffsetY === 0 ? 'transform 0.2s' : 'none',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Header */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            padding: '10px 16px 12px',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            touchAction: 'none',
          }}
        >
          {/* Drag handle (centrato) */}
          <div style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.2)' }} />

          <div style={{ width: '32px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '12px 0 0' }}>
            Commenti {comments.length > 0 && <span style={{ color: '#8E8E93', fontWeight: 500 }}>({comments.length})</span>}
          </h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#3C3C43',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Lista commenti */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8E8E93', fontSize: '13px' }}>
              Caricamento...
            </div>
          )}

          {!loading && rootComments.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0 }}>Ancora nessun commento.</p>
              <p style={{ fontSize: '12px', color: '#C7C7CC', margin: '6px 0 0' }}>Sii il primo a scrivere.</p>
            </div>
          )}

          {!loading && rootComments.map(c => (
            <div key={c.id}>
              <CommentRow
                comment={c}
                isReply={false}
                liked={likedIds.has(c.id)}
                currentUserId={currentUserId}
                editing={editingCommentId === c.id}
                editText={editText}
                onEditTextChange={setEditText}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onReply={() => {
                  setReplyTo(c)
                  setTimeout(() => inputRef.current?.focus(), 100)
                }}
                onLike={() => toggleCommentLike(c.id)}
                onDelete={() => deleteComment(c)}
                onEdit={() => startEdit(c)}
                onGoToProfile={(userId) => {
                  onClose()
                  if (userId === currentUserId) router.push('/profile')
                  else router.push('/profile/' + userId)
                }}
                onMentionClick={handleMentionClick}
              />
              {replyMap.get(c.id)?.map(r => (
                <CommentRow
                  key={r.id}
                  comment={r}
                  isReply={true}
                  liked={likedIds.has(r.id)}
                  currentUserId={currentUserId}
                  editing={editingCommentId === r.id}
                  editText={editText}
                  onEditTextChange={setEditText}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onReply={() => {
                    setReplyTo(r)
                    setTimeout(() => inputRef.current?.focus(), 100)
                  }}
                  onLike={() => toggleCommentLike(r.id)}
                  onDelete={() => deleteComment(r)}
                  onEdit={() => startEdit(r)}
                  onGoToProfile={(userId) => {
                    onClose()
                    if (userId === currentUserId) router.push('/profile')
                    else router.push('/profile/' + userId)
                  }}
                  onMentionClick={handleMentionClick}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div
          style={{
            background: '#FFF',
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
            padding: '10px 14px',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            position: 'relative',
          }}
        >
          {/* Mention autocomplete dropdown */}
          {mentionQuery !== null && mentionResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '8px',
                right: '8px',
                background: '#FFF',
                borderRadius: '12px',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
                border: '0.5px solid rgba(0,0,0,0.06)',
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '4px',
                zIndex: 5,
              }}
            >
              {mentionResults.map(u => {
                const username = u.username || 'utente'
                return (
                  <button
                    key={u.id}
                    onClick={() => insertMention(username)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: u.avatar_url ? 'transparent' : '#7CA982',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#000', margin: 0 }}>@{username}</p>
                      {u.full_name && (
                        <p style={{ fontSize: '11px', color: '#8E8E93', margin: '1px 0 0' }}>{u.full_name}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {replyTo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                background: 'rgba(124, 169, 130, 0.08)',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <p style={{ fontSize: '11px', color: '#4F7057', margin: 0, flex: 1 }}>
                Rispondi a <strong>@{replyTo.profiles?.username || 'utente'}</strong>
              </p>
              <button
                onClick={() => setReplyTo(null)}
                aria-label="Annulla"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#4F7057',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key === 'Enter') sendComment() }}
              placeholder={replyTo ? 'Scrivi la tua risposta...' : 'Aggiungi un commento...'}
              style={{
                flex: 1,
                height: '40px',
                padding: '0 14px',
                background: '#F2F2F7',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                color: '#000',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={sendComment}
              disabled={!newComment.trim() || sending}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: newComment.trim() && !sending ? '#7CA982' : '#E5E5EA',
                border: 'none',
                cursor: newComment.trim() && !sending ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: newComment.trim() && !sending ? '0 2px 8px rgba(124, 169, 130, 0.35)' : 'none',
                transition: 'all 0.15s',
              }}
              aria-label="Invia"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentRow({
  comment,
  isReply,
  liked,
  currentUserId,
  editing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onReply,
  onLike,
  onDelete,
  onEdit,
  onGoToProfile,
  onMentionClick,
}: {
  comment: Comment
  isReply: boolean
  liked: boolean
  currentUserId: string
  editing: boolean
  editText: string
  onEditTextChange: (v: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onReply: () => void
  onLike: () => void
  onDelete: () => void
  onEdit: () => void
  onGoToProfile: (userId: string) => void
  onMentionClick: (username: string) => void
}) {
  const username = comment.profiles?.username || 'utente'
  const fullName = comment.profiles?.full_name || username
  const avatar = getAvatarColor(username)
  const time = formatTimeShort(comment.created_at)
  const isOwn = comment.user_id === currentUserId
  // Edited: se updated_at differisce da created_at di > 2 secondi
  const isEdited = comment.updated_at &&
    Math.abs(new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime()) > 2000

  return (
    <div
      style={{
        padding: '10px 16px',
        paddingLeft: isReply ? '52px' : '16px',
        display: 'flex',
        gap: '10px',
      }}
    >
      <button
        onClick={() => comment.profiles?.id && onGoToProfile(comment.profiles.id)}
        style={{
          width: isReply ? '28px' : '34px',
          height: isReply ? '28px' : '34px',
          borderRadius: '50%',
          background: comment.profiles?.avatar_url ? 'transparent' : avatar.bg,
          color: avatar.text,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isReply ? '12px' : '14px',
          fontWeight: 700,
          flexShrink: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {comment.profiles?.avatar_url ? (
          <img src={comment.profiles.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          username[0].toUpperCase()
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            background: '#FFF',
            borderRadius: '14px',
            padding: '8px 12px',
            display: 'inline-block',
            maxWidth: '100%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <button
            onClick={() => comment.profiles?.id && onGoToProfile(comment.profiles.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              color: '#000',
              display: 'block',
              marginBottom: '2px',
            }}
          >
            {fullName}
          </button>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <textarea
                value={editText}
                onChange={e => onEditTextChange(e.target.value)}
                autoFocus
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1.5px solid #7CA982',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#000',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  background: '#FFF',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={onCancelEdit}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#8E8E93',
                    padding: '4px 8px',
                  }}
                >
                  Annulla
                </button>
                <button
                  onClick={onSaveEdit}
                  disabled={!editText.trim()}
                  style={{
                    background: editText.trim() ? '#7CA982' : '#C7C7CC',
                    border: 'none',
                    cursor: editText.trim() ? 'pointer' : 'default',
                    fontSize: '12px',
                    color: '#FFF',
                    fontWeight: 600,
                    padding: '5px 14px',
                    borderRadius: '8px',
                  }}
                >
                  Salva
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#000', margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {renderTextWithMentions(comment.text, onMentionClick)}
              {isEdited && (
                <span style={{ fontSize: '10px', color: '#8E8E93', marginLeft: '6px', fontStyle: 'italic' }}>(modificato)</span>
              )}
            </p>
          )}
        </div>

        {!editing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 12px', fontSize: '11px', color: '#8E8E93' }}>
            <span>{time}</span>
            <button
              onClick={onLike}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                color: liked ? '#FF3B30' : '#8E8E93',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {liked ? 'Piace' : 'Mi piace'}
              {comment.likes_count > 0 && <span>({comment.likes_count})</span>}
            </button>
            <button
              onClick={onReply}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                color: '#8E8E93',
                padding: 0,
              }}
            >
              Rispondi
            </button>
            {isOwn && (
              <button
                onClick={onEdit}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#007AFF',
                  padding: 0,
                }}
              >
                Modifica
              </button>
            )}
            {isOwn && (
              <button
                onClick={onDelete}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#FF3B30',
                  padding: 0,
                }}
              >
                Elimina
              </button>
            )}
          </div>
        )}
      </div>
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

function formatTimeShort(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'ora'
  if (diff < 3600) return Math.floor(diff / 60) + 'min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  if (diff < 604800) return Math.floor(diff / 86400) + 'g'
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

// Renderizza il testo del commento evidenziando @menzioni come link cliccabili
function renderTextWithMentions(text: string, onMentionClick?: (username: string) => void): React.ReactNode {
  const parts = text.split(/(@\w+)/g)
  return parts.map((p, i) => {
    if (p.startsWith('@') && p.length > 1) {
      const username = p.slice(1)
      return (
        <span
          key={i}
          onClick={(e) => {
            if (onMentionClick) {
              e.stopPropagation()
              onMentionClick(username)
            }
          }}
          style={{
            color: '#7CA982',
            fontWeight: 600,
            cursor: onMentionClick ? 'pointer' : 'default',
          }}
        >
          {p}
        </span>
      )
    }
    return <span key={i}>{p}</span>
  })
}
