"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import BottomNav from '@/app/components/BottomNav'

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
  activity_level: string | null
  goal: string | null
  workout_frequency: number | null
  daily_water_goal_liters: number | null
  bio: string | null
}

type PostSummary = {
  id: string
  type: string
  meal_photo_url: string | null
  meal_type: string | null
  workout_type: string | null
  workout_distance_km: number | null
  workout_duration_min: number | null
  created_at: string
}

type TabView = 'overview' | 'posts' | 'achievements'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabView>('overview')
  const [editMode, setEditMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState<Partial<Profile>>({})

  useEffect(() => {
    if (!user) return router.push('/login')
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p) {
      setProfile(p)
      setEditForm(p)
    }

    const { data: ps } = await supabase
      .from('posts')
      .select('id, type, meal_photo_url, meal_type, workout_type, workout_distance_km, workout_duration_min, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (ps) setPosts(ps)

    setLoading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        username: editForm.username,
        weight_kg: editForm.weight_kg,
        height_cm: editForm.height_cm,
        age: editForm.age,
        goal: editForm.goal,
        activity_level: editForm.activity_level,
        workout_frequency: editForm.workout_frequency,
        bio: editForm.bio,
      })
      .eq('id', user.id)

    if (!error) {
      setProfile({ ...profile, ...editForm } as Profile)
      setEditMode(false)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#7CA982] animate-spin" />
      </div>
    )
  }

  const username = profile?.username || user?.email?.split('@')[0] || 'utente'
  const fullName = profile?.full_name || username
  const avatar = getAvatarColor(username)

  /* ========== STATS COMPUTATIONS ========== */
  const totalPosts = posts.length
  const workoutPosts = posts.filter(p => p.type === 'allenamento')
  const mealPosts = posts.filter(p => p.type === 'pasto')
  const totalDistance = workoutPosts.reduce((sum, p) => sum + (p.workout_distance_km || 0), 0)
  const totalDurationMin = workoutPosts.reduce((sum, p) => sum + (p.workout_duration_min || 0), 0)

  // Streak calculation (giorni consecutivi con almeno 1 post)
  const streak = computeStreak(posts)

  // BMI
  const bmi =
    profile?.weight_kg && profile?.height_cm
      ? profile.weight_kg / Math.pow(profile.height_cm / 100, 2)
      : null

  // Achievements
  const achievements = computeAchievements({
    totalPosts,
    totalDistance,
    workoutCount: workoutPosts.length,
    mealCount: mealPosts.length,
    streak,
  })
  const unlockedCount = achievements.filter(a => a.unlocked).length

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.5px' }}>
              Profilo
            </h1>
            <div style={{ display: 'flex', gap: '6px' }}>
              <IconBtn
                onClick={() => setShowSettings(true)}
                aria="Impostazioni"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                }
              />
            </div>
          </div>
        </header>

        <main style={{ paddingBottom: '100px' }}>
          {/* AVATAR + NAME + BIO BLOCK */}
          <div style={{ padding: '20px 20px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: avatar.bg,
                  color: avatar.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  position: 'relative',
                }}
              >
                {username[0].toUpperCase()}
                <button
                  onClick={() => setEditMode(true)}
                  aria-label="Modifica foto"
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#FFF',
                    border: '2px solid #F2F2F7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              </div>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#000', margin: 0, letterSpacing: '-0.3px' }}>
              {fullName}
            </h2>
            <p style={{ fontSize: '14px', color: '#8E8E93', margin: '2px 0 0' }}>@{username}</p>

            {profile?.goal && (
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
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4F7057' }}>
                  {goalLabel(profile.goal)}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: '#FFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#000',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  flex: 1,
                  maxWidth: '160px',
                }}
              >
                Modifica profilo
              </button>
              <button
                onClick={() => router.push('/new-post')}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: '#7CA982',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFF',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(124, 169, 130, 0.3)',
                  flex: 1,
                  maxWidth: '160px',
                }}
              >
                Nuovo post
              </button>
            </div>
          </div>

          {/* SOCIAL STATS BAR */}
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
            <SocialStat value={totalPosts} label="Post" />
            <Divider />
            <SocialStat value={0} label="Follower" />
            <Divider />
            <SocialStat value={0} label="Seguiti" />
          </div>

          {/* TAB SWITCHER */}
          <div style={{ padding: '0 20px 14px' }}>
            <div
              style={{
                background: 'rgba(118, 118, 128, 0.12)',
                borderRadius: '10px',
                padding: '2px',
                display: 'flex',
              }}
            >
              {[
                { key: 'overview' as TabView, label: 'Panoramica' },
                { key: 'posts' as TabView, label: 'Post' },
                { key: 'achievements' as TabView, label: 'Obiettivi' },
              ].map(t => {
                const active = tab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
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
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* TAB CONTENT */}
          <div style={{ padding: '0 20px' }}>
            {tab === 'overview' && (
              <OverviewTab
                profile={profile}
                bmi={bmi}
                totalPosts={totalPosts}
                workoutCount={workoutPosts.length}
                mealCount={mealPosts.length}
                totalDistance={totalDistance}
                totalDurationMin={totalDurationMin}
                streak={streak}
                unlockedCount={unlockedCount}
                totalAchievements={achievements.length}
                onGoToAchievements={() => setTab('achievements')}
              />
            )}
            {tab === 'posts' && <PostsTab posts={posts} router={router} />}
            {tab === 'achievements' && <AchievementsTab achievements={achievements} />}
          </div>
        </main>
      </div>

      {/* EDIT MODAL */}
      {editMode && profile && (
        <EditModal
          form={editForm}
          setForm={setEditForm}
          onSave={handleSave}
          onCancel={() => {
            setEditForm(profile)
            setEditMode(false)
          }}
          saving={saving}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          email={user?.email || ''}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}

      <BottomNav />
    </div>
  )
}

/* ================= HELPERS ================= */

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

function activityLabel(a: string | null | undefined) {
  if (!a) return '-'
  const map: Record<string, string> = {
    sedentario: 'Sedentario',
    leggero: 'Leggero',
    moderato: 'Moderato',
    attivo: 'Attivo',
    molto_attivo: 'Molto attivo',
  }
  return map[a] || a
}

function computeStreak(posts: PostSummary[]): number {
  if (posts.length === 0) return 0
  const days = new Set(posts.map(p => new Date(p.created_at).toISOString().slice(0, 10)))
  const sortedDays = Array.from(days).sort().reverse()
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 60; i++) {
    const check = new Date(today)
    check.setDate(today.getDate() - i)
    const key = check.toISOString().slice(0, 10)
    if (sortedDays.includes(key)) {
      streak++
    } else if (i === 0) {
      continue
    } else {
      break
    }
  }
  return streak
}

type Achievement = { id: string; title: string; desc: string; icon: string; unlocked: boolean; color: string }

function computeAchievements(s: { totalPosts: number; totalDistance: number; workoutCount: number; mealCount: number; streak: number }): Achievement[] {
  return [
    { id: 'first_post', title: 'Primo post', desc: 'Hai condiviso il tuo primo contenuto', icon: '\u2728', unlocked: s.totalPosts >= 1, color: '#7CA982' },
    { id: 'week_streak', title: 'Settimana di fuoco', desc: '7 giorni di attivit' + '\u00E0' + ' consecutivi', icon: '\uD83D\uDD25', unlocked: s.streak >= 7, color: '#D17A3C' },
    { id: 'month_streak', title: 'Mese di costanza', desc: '30 giorni consecutivi', icon: '\uD83C\uDFC6', unlocked: s.streak >= 30, color: '#E8A857' },
    { id: 'ten_workouts', title: 'Dieci allenamenti', desc: 'Hai postato 10 sessioni', icon: '\uD83D\uDCAA', unlocked: s.workoutCount >= 10, color: '#3B82F6' },
    { id: 'fifty_km', title: '50 km totali', desc: 'Hai percorso 50 km', icon: '\uD83C\uDFC3', unlocked: s.totalDistance >= 50, color: '#8B5CF6' },
    { id: 'nutrition_master', title: 'Maestro cucina', desc: '20 pasti condivisi', icon: '\uD83D\uDD7D', unlocked: s.mealCount >= 20, color: '#EC4899' },
    { id: 'fifty_posts', title: 'Community star', desc: '50 post totali', icon: '\u2B50', unlocked: s.totalPosts >= 50, color: '#F59E0B' },
    { id: 'hundred_km', title: 'Centurione', desc: '100 km totali percorsi', icon: '\uD83D\uDC51', unlocked: s.totalDistance >= 100, color: '#DC2626' },
  ]
}

/* ================= SUB-COMPONENTS ================= */

function IconBtn({ onClick, aria, icon }: { onClick: () => void; aria: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'rgba(0,0,0,0.04)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </button>
  )
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

function OverviewTab(props: {
  profile: Profile | null
  bmi: number | null
  totalPosts: number
  workoutCount: number
  mealCount: number
  totalDistance: number
  totalDurationMin: number
  streak: number
  unlockedCount: number
  totalAchievements: number
  onGoToAchievements: () => void
}) {
  const { profile, bmi, workoutCount, mealCount, totalDistance, totalDurationMin, streak, unlockedCount, totalAchievements, onGoToAchievements } = props
  const bmiCategory = bmi ? (bmi < 18.5 ? 'Sottopeso' : bmi < 25 ? 'Normopeso' : bmi < 30 ? 'Sovrappeso' : 'Obesit' + '\u00E0') : '-'
  const bmiColor = bmi ? (bmi < 18.5 ? '#3B82F6' : bmi < 25 ? '#30D158' : bmi < 30 ? '#E8A857' : '#DC2626') : '#8E8E93'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '20px' }}>
      {/* STREAK CARD (hero) */}
      {streak > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #D17A3C, #E8A857)',
            borderRadius: '16px',
            padding: '18px 18px',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 4px 14px rgba(209, 122, 60, 0.25)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            <span role="img" aria-label="fire">{'\uD83D\uDD25'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', margin: 0, opacity: 0.9 }}>
              STREAK ATTUALE
            </p>
            <p style={{ fontSize: '24px', fontWeight: 800, margin: '2px 0 0', letterSpacing: '-0.3px' }}>
              {streak} {streak === 1 ? 'giorno' : 'giorni'}
            </p>
            <p style={{ fontSize: '12px', margin: '2px 0 0', opacity: 0.9 }}>
              Continua cosi per non perderla
            </p>
          </div>
        </div>
      )}

      {/* KEY METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <MetricCard label="ALLENAMENTI" value={String(workoutCount)} unit="totali" color="#7CA982" />
        <MetricCard label="PASTI LOG" value={String(mealCount)} unit="tracciati" color="#D17A3C" />
        <MetricCard label="DISTANZA" value={totalDistance.toFixed(1)} unit="km" color="#3B82F6" />
        <MetricCard label="TEMPO TOT" value={formatMinutes(totalDurationMin)} unit="attivo" color="#8B5CF6" />
      </div>

      {/* PHYSICAL DATA CARD */}
      <div style={cardStyle}>
        <SectionHeader title="Dati fisici" />
        <InfoRow label="Peso attuale" value={profile?.weight_kg ? profile.weight_kg + ' kg' : '-'} />
        <InfoRow label="Altezza" value={profile?.height_cm ? profile.height_cm + ' cm' : '-'} />
        <InfoRow label={'Et' + '\u00E0'} value={profile?.age ? profile.age + ' anni' : '-'} />
        {bmi && (
          <InfoRow
            label="BMI"
            value={
              <span>
                <span style={{ fontWeight: 700 }}>{bmi.toFixed(1)}</span>
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: bmiColor + '22',
                    color: bmiColor,
                  }}
                >
                  {bmiCategory}
                </span>
              </span>
            }
            last
          />
        )}
      </div>

      {/* LIFESTYLE CARD */}
      <div style={cardStyle}>
        <SectionHeader title="Stile di vita" />
        <InfoRow label="Obiettivo" value={profile?.goal ? goalLabel(profile.goal) : '-'} />
        <InfoRow label={'Attivit' + '\u00E0'} value={activityLabel(profile?.activity_level)} />
        <InfoRow
          label="Allenamenti/sett"
          value={profile?.workout_frequency ? profile.workout_frequency + 'x' : '-'}
        />
        <InfoRow
          label="Acqua al giorno"
          value={profile?.daily_water_goal_liters ? profile.daily_water_goal_liters + ' L' : '-'}
          last
        />
      </div>

      {/* ACHIEVEMENTS PREVIEW */}
      <button
        onClick={onGoToAchievements}
        style={{
          ...cardStyle,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(232, 168, 87, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            flexShrink: 0,
          }}
        >
          <span role="img">{'\uD83C\uDFC6'}</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#000', margin: 0 }}>
            Obiettivi
          </p>
          <p style={{ fontSize: '13px', color: '#8E8E93', margin: '2px 0 0' }}>
            {unlockedCount} di {totalAchievements} sbloccati
          </p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* BIO (if present) */}
      {profile?.bio && (
        <div style={cardStyle}>
          <SectionHeader title="Bio" />
          <p style={{ fontSize: '13px', color: '#3C3C43', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', padding: '4px 0' }}>
            {profile.bio}
          </p>
        </div>
      )}
    </div>
  )
}

function PostsTab({ posts, router }: { posts: PostSummary[]; router: ReturnType<typeof useRouter> }) {
  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            background: 'rgba(124, 169, 130, 0.15)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7CA982" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>Nessun post ancora</p>
        <p style={{ fontSize: '13px', color: '#8E8E93', margin: '4px 0 16px' }}>Inizia a condividere i tuoi progressi</p>
        <button
          onClick={() => router.push('/new-post')}
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
          Crea il primo post
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', paddingBottom: '20px' }}>
      {posts.map(post => {
        if (post.type === 'pasto' && post.meal_photo_url) {
          return (
            <div key={post.id} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: '4px' }}>
              <img src={post.meal_photo_url} alt="Pasto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )
        }
        if (post.type === 'allenamento') {
          return (
            <div
              key={post.id}
              style={{
                aspectRatio: '1',
                background: 'linear-gradient(135deg, #7CA982, #5B8C7B)',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFF',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 6.5l11 11M6.5 17.5l11-11" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, margin: 0, opacity: 0.9 }}>
                  {post.workout_type || 'Allenamento'}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0 0' }}>
                  {post.workout_distance_km ? post.workout_distance_km + ' km' : post.workout_duration_min + ' min'}
                </p>
              </div>
            </div>
          )
        }
        return (
          <div
            key={post.id}
            style={{
              aspectRatio: '1',
              background: '#F2F2F7',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        )
      })}
    </div>
  )
}

function AchievementsTab({ achievements }: { achievements: Achievement[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingBottom: '20px' }}>
      {achievements.map(a => (
        <div
          key={a.id}
          style={{
            background: '#FFF',
            borderRadius: '14px',
            padding: '14px',
            textAlign: 'center',
            opacity: a.unlocked ? 1 : 0.45,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: a.unlocked ? a.color + '22' : '#F2F2F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '28px',
              filter: a.unlocked ? 'none' : 'grayscale(1)',
            }}
          >
            <span role="img">{a.icon}</span>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#000', margin: 0 }}>{a.title}</p>
          <p style={{ fontSize: '11px', color: '#8E8E93', margin: '3px 0 0', lineHeight: 1.3 }}>{a.desc}</p>
          {!a.unlocked && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                color: '#C7C7CC',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#FFF',
  borderRadius: '14px',
  padding: '12px 16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.5px', margin: '4px 0 4px', textTransform: 'uppercase' }}>
      {title}
    </p>
  )
}

function InfoRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: last ? 'none' : '0.5px solid rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ fontSize: '14px', color: '#3C3C43' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#000', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function MetricCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div
      style={{
        background: '#FFF',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <p style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.5px', margin: 0 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, color: '#000', lineHeight: 1, letterSpacing: '-0.5px' }}>
          {value}
        </span>
      </div>
      <p style={{ fontSize: '11px', color: '#8E8E93', margin: '4px 0 0' }}>{unit}</p>
    </div>
  )
}

function formatMinutes(min: number): string {
  if (min < 60) return String(min) + 'm'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return h + 'h'
  return h + 'h ' + m + 'm'
}

/* ================= EDIT MODAL ================= */

function EditModal({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: Partial<Profile>
  setForm: (f: Partial<Profile>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const upd = (k: keyof Profile, v: string | number | null) => setForm({ ...form, [k]: v })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#F2F2F7',
          width: '100%',
          maxWidth: '430px',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '90vh',
          overflowY: 'auto',
          paddingBottom: '32px',
        }}
      >
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: '#F2F2F7',
            zIndex: 1,
          }}
        >
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '15px', cursor: 'pointer', padding: '8px 0' }}>
            Annulla
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Modifica profilo</h3>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '15px', fontWeight: 600, cursor: 'pointer', padding: '8px 0' }}
          >
            {saving ? 'Salvo...' : 'Salva'}
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <EditField label="Nome completo" value={form.full_name || ''} onChange={v => upd('full_name', v)} />
          <EditField label="Username" value={form.username || ''} onChange={v => upd('username', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
          <EditField label="Bio" value={form.bio || ''} onChange={v => upd('bio', v)} multiline />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <EditField label="Peso" value={String(form.weight_kg || '')} onChange={v => upd('weight_kg', parseFloat(v) || null)} numeric suffix="kg" />
            <EditField label="Altezza" value={String(form.height_cm || '')} onChange={v => upd('height_cm', parseFloat(v) || null)} numeric suffix="cm" />
            <EditField label={'Et' + '\u00E0'} value={String(form.age || '')} onChange={v => upd('age', parseInt(v) || null)} numeric />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Obiettivo
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { v: 'asciugarsi', l: 'Perdere grasso' },
                { v: 'massa', l: 'Massa' },
                { v: 'mantenimento', l: 'Mantenimento' },
                { v: 'salute', l: 'Salute' },
              ].map(opt => {
                const active = form.goal === opt.v
                return (
                  <button
                    key={opt.v}
                    onClick={() => upd('goal', opt.v)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: active ? '#7CA982' : '#FFF',
                      color: active ? '#FFF' : '#000',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.l}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Allenamenti a settimana
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(n => {
                const active = form.workout_frequency === n
                return (
                  <button
                    key={n}
                    onClick={() => upd('workout_frequency', n)}
                    style={{
                      padding: '10px 0',
                      borderRadius: '8px',
                      background: active ? '#7CA982' : '#FFF',
                      color: active ? '#FFF' : '#000',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  numeric,
  suffix,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  numeric?: boolean
  suffix?: string
  multiline?: boolean
}) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#FFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              color: '#000',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          />
        ) : (
          <input
            type="text"
            inputMode={numeric ? 'decimal' : 'text'}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              padding: suffix ? '0 46px 0 14px' : '0 14px',
              background: '#FFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              color: '#000',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          />
        )}
        {suffix && (
          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#8E8E93', pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

/* ================= SETTINGS MODAL ================= */

function SettingsModal({ email, onClose, onLogout }: { email: string; onClose: () => void; onLogout: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
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
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          paddingBottom: '32px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ width: '60px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Impostazioni</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '15px', fontWeight: 500, cursor: 'pointer', width: '60px', textAlign: 'right' }}>
            Fine
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <SettingsGroup title="Account">
            <SettingsRow label="Email" value={email} readOnly />
            <SettingsRow label="Cambia password" action />
            <SettingsRow label="Cambia email" action />
          </SettingsGroup>

          <SettingsGroup title="Privacy">
            <SettingsRow label="Account privato" toggle defaultOn={false} />
            <SettingsRow label="Notifiche push" toggle defaultOn={true} />
            <SettingsRow label="Notifiche email" toggle defaultOn={true} />
          </SettingsGroup>

          <SettingsGroup title="App">
            <SettingsRow label="Lingua" value="Italiano" action />
            <SettingsRow label={'Unit\u00E0 di misura'} value="Metrico (kg, km)" action />
            <SettingsRow label="Tema" value="Sistema" action />
          </SettingsGroup>

          <SettingsGroup title="Supporto">
            <SettingsRow label="Centro aiuto" action />
            <SettingsRow label="Termini di servizio" action />
            <SettingsRow label="Privacy policy" action />
            <SettingsRow label="Versione" value="1.0.0 beta" readOnly />
          </SettingsGroup>

          <button
            onClick={onLogout}
            style={{
              padding: '14px',
              background: '#FFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#DC2626',
              cursor: 'pointer',
              marginTop: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            Esci dall account
          </button>

          <button
            style={{
              padding: '14px',
              background: 'transparent',
              border: 'none',
              fontSize: '13px',
              color: '#8E8E93',
              cursor: 'pointer',
            }}
          >
            Elimina account
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', margin: '0 16px 6px' }}>
        {title}
      </p>
      <div style={{ background: '#FFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {children}
      </div>
    </div>
  )
}

function SettingsRow({
  label,
  value,
  action,
  readOnly,
  toggle,
  defaultOn,
}: {
  label: string
  value?: string
  action?: boolean
  readOnly?: boolean
  toggle?: boolean
  defaultOn?: boolean
}) {
  const [on, setOn] = useState(defaultOn || false)
  return (
    <div
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(0,0,0,0.06)',
        cursor: action ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: '15px', color: '#000' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {value && <span style={{ fontSize: '14px', color: '#8E8E93' }}>{value}</span>}
        {toggle && (
          <button
            onClick={() => setOn(!on)}
            style={{
              width: '50px',
              height: '30px',
              borderRadius: '15px',
              background: on ? '#30D158' : '#E5E5EA',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: on ? '22px' : '2px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#FFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'left 0.2s',
              }}
            />
          </button>
        )}
        {action && !toggle && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </div>
  )
}
