"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

type PostType = 'pasto' | 'allenamento' | null
type WorkoutSource = 'manuale' | 'watch'
type MealType = 'colazione' | 'pranzo' | 'cena' | 'snack'
type WorkoutType = 'corsa' | 'bici' | 'palestra' | 'camminata' | 'yoga' | 'hiit' | 'nuoto' | 'altro'

type Ingredient = {
  id: string
  name: string
  grams: number
  kcal_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  source: 'ai' | 'manual' | 'barcode'
}

// Mini database alimenti (valori medi USDA/CREA per 100g)
const FOOD_DB: Array<Omit<Ingredient, 'id' | 'grams' | 'source'>> = [
  { name: 'Riso bianco cotto', kcal_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
  { name: 'Riso integrale cotto', kcal_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9 },
  { name: 'Pasta cotta', kcal_per_100g: 158, protein_per_100g: 5.8, carbs_per_100g: 31, fat_per_100g: 0.9 },
  { name: 'Petto di pollo', kcal_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { name: 'Salmone', kcal_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13 },
  { name: 'Tonno al naturale', kcal_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1 },
  { name: 'Uova', kcal_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  { name: 'Avocado', kcal_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15 },
  { name: 'Pomodori', kcal_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2 },
  { name: 'Insalata mista', kcal_per_100g: 20, protein_per_100g: 1.5, carbs_per_100g: 3, fat_per_100g: 0.3 },
  { name: 'Pane integrale', kcal_per_100g: 247, protein_per_100g: 13, carbs_per_100g: 41, fat_per_100g: 3.4 },
  { name: 'Yogurt greco', kcal_per_100g: 97, protein_per_100g: 9, carbs_per_100g: 3.6, fat_per_100g: 5 },
  { name: 'Banana', kcal_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
  { name: 'Mela', kcal_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2 },
  { name: 'Mandorle', kcal_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
  { name: 'Olio extravergine', kcal_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
  { name: 'Parmigiano', kcal_per_100g: 392, protein_per_100g: 36, carbs_per_100g: 4, fat_per_100g: 26 },
  { name: 'Ricotta', kcal_per_100g: 174, protein_per_100g: 11, carbs_per_100g: 3, fat_per_100g: 13 },
  { name: 'Patate lesse', kcal_per_100g: 87, protein_per_100g: 1.9, carbs_per_100g: 20, fat_per_100g: 0.1 },
  { name: 'Legumi cotti', kcal_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.5 },
  { name: 'Quinoa cotta', kcal_per_100g: 120, protein_per_100g: 4.4, carbs_per_100g: 21, fat_per_100g: 1.9 },
  { name: 'Spinaci', kcal_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
]

export default function NewPostPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [type, setType] = useState<PostType>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, router])

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
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => (type ? setType(null) : router.push('/feed'))}
            style={{
              background: 'none',
              border: 'none',
              color: '#007AFF',
              fontSize: '15px',
              cursor: 'pointer',
              padding: '8px 0',
              fontWeight: 500,
            }}
          >
            {type ? 'Indietro' : 'Annulla'}
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#000' }}>
            {type === 'pasto' ? 'Nuovo pasto' : type === 'allenamento' ? 'Nuovo allenamento' : 'Crea post'}
          </h1>
          <div style={{ width: '60px' }} />
        </header>

        {/* CONTENT */}
        {type === null && <TypeSelector onSelect={setType} />}
        {type === 'pasto' && (
          <MealFlow
            user={user}
            onSaving={setSaving}
            onError={setError}
            saving={saving}
            error={error}
            router={router}
          />
        )}
        {type === 'allenamento' && (
          <WorkoutFlow
            user={user}
            onSaving={setSaving}
            onError={setError}
            saving={saving}
            error={error}
            router={router}
          />
        )}
      </div>
    </div>
  )
}

/* ============ TYPE SELECTOR ============ */
function TypeSelector({ onSelect }: { onSelect: (t: PostType) => void }) {
  return (
    <div style={{ padding: '24px 20px 80px' }}>
      <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.5px' }}>
        Cosa vuoi condividere?
      </h2>
      <p style={{ fontSize: '14px', color: '#8E8E93', margin: '6px 0 24px' }}>
        Scegli il tipo di post.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <TypeCard
          onClick={() => onSelect('pasto')}
          color="#D17A3C"
          bgColor="rgba(209, 122, 60, 0.1)"
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D17A3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          }
          title="Pasto"
          desc="Condividi cosa hai mangiato. L AI stima calorie e macro dalla foto."
        />
        <TypeCard
          onClick={() => onSelect('allenamento')}
          color="#7CA982"
          bgColor="rgba(124, 169, 130, 0.12)"
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7CA982" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11v11h-11z" />
              <path d="M9.5 9.5h5v5h-5z" />
              <path d="M6.5 2v4M17.5 2v4M6.5 18v4M17.5 18v4M2 6.5h4M2 17.5h4M18 6.5h4M18 17.5h4" />
            </svg>
          }
          title="Allenamento"
          desc="Registra una sessione manuale o importala da Apple Watch."
        />
      </div>

      <div
        style={{
          marginTop: '28px',
          padding: '14px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderRadius: '12px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#3B82F6" style={{ flexShrink: 0, marginTop: '1px' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" stroke="#FFF" strokeWidth="2" />
          <circle cx="12" cy="16" r="1" fill="#FFF" />
        </svg>
        <p style={{ fontSize: '12px', color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
          Ogni post puo essere reso pubblico o privato. Gli allenamenti da Apple Watch possono essere condivisi automaticamente dalle impostazioni.
        </p>
      </div>
    </div>
  )
}

function TypeCard({
  onClick,
  color,
  bgColor,
  icon,
  title,
  desc,
}: {
  onClick: () => void
  color: string
  bgColor: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#FFF',
        border: 'none',
        borderRadius: '16px',
        padding: '18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        textAlign: 'left',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#000', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#8E8E93', margin: '2px 0 0', lineHeight: 1.4 }}>{desc}</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

/* ============ MEAL FLOW ============ */
function MealFlow({
  user,
  onSaving,
  onError,
  saving,
  error,
  router,
}: {
  user: any
  onSaving: (b: boolean) => void
  onError: (s: string) => void
  saving: boolean
  error: string
  router: ReturnType<typeof useRouter>
}) {
  const [caption, setCaption] = useState('')
  const [mealType, setMealType] = useState<MealType>('pranzo')
  const [photo, setPhoto] = useState<string | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showAddIngredient, setShowAddIngredient] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [aiAnalyzed, setAiAnalyzed] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const totals = ingredients.reduce(
    (acc, ing) => ({
      kcal: acc.kcal + (ing.kcal_per_100g * ing.grams) / 100,
      protein: acc.protein + (ing.protein_per_100g * ing.grams) / 100,
      carbs: acc.carbs + (ing.carbs_per_100g * ing.grams) / 100,
      fat: acc.fat + (ing.fat_per_100g * ing.grams) / 100,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const simulateAiAnalysis = () => {
    setAiLoading(true)
    setTimeout(() => {
      // Placeholder: quando collegherai vera AI vision, sostituisci questa logica
      const fakeDetected: Ingredient[] = [
        { id: 'ai-1', name: 'Riso bianco cotto', grams: 150, kcal_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, source: 'ai' },
        { id: 'ai-2', name: 'Petto di pollo', grams: 120, kcal_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, source: 'ai' },
        { id: 'ai-3', name: 'Insalata mista', grams: 60, kcal_per_100g: 20, protein_per_100g: 1.5, carbs_per_100g: 3, fat_per_100g: 0.3, source: 'ai' },
      ]
      setIngredients(fakeDetected)
      setAiAnalyzed(true)
      setAiLoading(false)
    }, 1500)
  }

  const handleAddIngredient = (food: (typeof FOOD_DB)[0], grams: number) => {
    setIngredients([
      ...ingredients,
      {
        id: 'manual-' + Date.now(),
        name: food.name,
        grams,
        kcal_per_100g: food.kcal_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fat_per_100g: food.fat_per_100g,
        source: 'manual',
      },
    ])
    setShowAddIngredient(false)
  }

  const handleUpdateGrams = (id: string, grams: number) => {
    setIngredients(ingredients.map(i => (i.id === id ? { ...i, grams } : i)))
  }

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id))
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!caption.trim() && ingredients.length === 0 && !photo) {
      onError('Aggiungi almeno una descrizione, un ingrediente o una foto.')
      return
    }
    onSaving(true)
    onError('')

    // Inserisci il post e recupera l'id
    const { data: postData, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user!.id,
        type: 'pasto',
        is_private: isPrivate,
        meal_description: caption.trim() || null,
        meal_photo_url: photo,
        meal_type: mealType,
      })
      .select('id')
      .single()

    if (insertError || !postData) {
      onError('Errore salvataggio: ' + (insertError?.message || 'sconosciuto'))
      onSaving(false)
      return
    }

    // Inserisci gli ingredienti nella tabella dedicata
    if (ingredients.length > 0) {
      const ingredientRows = ingredients.map((ing, idx) => ({
        post_id: postData.id,
        name: ing.name,
        grams: ing.grams,
        kcal_per_100g: ing.kcal_per_100g,
        protein_per_100g: ing.protein_per_100g,
        carbs_per_100g: ing.carbs_per_100g,
        fat_per_100g: ing.fat_per_100g,
        source: ing.source,
        position: idx,
      }))
      const { error: ingErr } = await supabase.from('post_ingredients').insert(ingredientRows)
      if (ingErr) {
        // Post salvato ma ingredienti no - continuo comunque
        console.error('Errore salvataggio ingredienti:', ingErr)
      }
    }

    router.push('/feed')
  }

  return (
    <div style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* PHOTO UPLOAD */}
      <div style={cardStyle}>
        <SectionLabel>Foto del pasto</SectionLabel>
        {photo ? (
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginTop: '8px' }}>
            <img src={photo} alt="Pasto" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }} />
            <button
              onClick={() => {
                setPhoto(null)
                setAiAnalyzed(false)
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <input
              id="meal-photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !user) return
                // Upload a Supabase Storage
                const ext = file.name.split('.').pop() || 'jpg'
                const path = user!.id + '/' + Date.now() + '.' + ext
                const { error: upErr } = await supabase.storage
                  .from('post-photos')
                  .upload(path, file, { cacheControl: '3600', upsert: false })
                if (upErr) {
                  onError('Errore upload foto: ' + upErr.message)
                  return
                }
                const { data: urlData } = supabase.storage.from('post-photos').getPublicUrl(path)
                setPhoto(urlData.publicUrl)
              }}
            />
            <input
              id="meal-gallery-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !user) return
                const ext = file.name.split('.').pop() || 'jpg'
                const path = user!.id + '/' + Date.now() + '.' + ext
                const { error: upErr } = await supabase.storage
                  .from('post-photos')
                  .upload(path, file, { cacheControl: '3600', upsert: false })
                if (upErr) {
                  onError('Errore upload foto: ' + upErr.message)
                  return
                }
                const { data: urlData } = supabase.storage.from('post-photos').getPublicUrl(path)
                setPhoto(urlData.publicUrl)
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => document.getElementById('meal-photo-input')?.click()}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#F2F2F7',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#3C3C43',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Fotografa</span>
              </button>
              <button
                onClick={() => document.getElementById('meal-gallery-input')?.click()}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#F2F2F7',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#3C3C43',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Dalla galleria</span>
            </button>
            <button
              onClick={() => alert('Scanner codice a barre in arrivo')}
              style={{
                flex: 1,
                padding: '14px',
                background: '#F2F2F7',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                color: '#3C3C43',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Barcode</span>
            </button>
          </div>
          </div>
        )}
      </div>

      {/* AI RECOGNITION CARD */}
      {photo && !aiAnalyzed && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(124, 169, 130, 0.15), rgba(59, 130, 246, 0.1))',
            borderRadius: '14px',
            padding: '14px',
            border: '1.5px solid rgba(124, 169, 130, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#7CA982',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFF" stroke="none">
                <path d="M12 3l1.88 4.62L18.5 9.5l-4.62 1.88L12 16l-1.88-4.62L5.5 9.5l4.62-1.88z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#000', margin: 0 }}>
                AI Recognition
              </p>
              <p style={{ fontSize: '12px', color: '#3C3C43', margin: '2px 0 0' }}>
                Stima automaticamente ingredienti e quantita dalla foto
              </p>
            </div>
          </div>
          <button
            onClick={simulateAiAnalysis}
            disabled={aiLoading}
            style={{
              width: '100%',
              padding: '10px',
              background: '#7CA982',
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: aiLoading ? 'wait' : 'pointer',
              boxShadow: '0 2px 6px rgba(124, 169, 130, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {aiLoading ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFF',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Analisi in corso...
              </>
            ) : (
              'Analizza foto con AI'
            )}
          </button>
        </div>
      )}

      {aiAnalyzed && (
        <div
          style={{
            background: 'rgba(48, 209, 88, 0.1)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#30D158">
            <circle cx="12" cy="12" r="10" />
            <polyline points="16 10 11 15 8 12" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ fontSize: '13px', color: '#147A2E', margin: 0, fontWeight: 500 }}>
            Ingredienti rilevati. Modificali se necessario.
          </p>
        </div>
      )}

      {/* CAPTION */}
      <div style={cardStyle}>
        <SectionLabel>Descrizione</SectionLabel>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Pranzo domenicale con nonna..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            fontSize: '15px',
            color: '#000',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.4,
            marginTop: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* MEAL TYPE */}
      <div style={cardStyle}>
        <SectionLabel>Tipo di pasto</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginTop: '8px' }}>
          {(['colazione', 'pranzo', 'cena', 'snack'] as MealType[]).map(t => {
            const active = mealType === t
            return (
              <button
                key={t}
                onClick={() => setMealType(t)}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  background: active ? '#7CA982' : '#F2F2F7',
                  color: active ? '#FFF' : '#3C3C43',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* INGREDIENTS LIST */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <SectionLabel>Ingredienti</SectionLabel>
          <button
            onClick={() => setShowAddIngredient(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#7CA982',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            + Aggiungi
          </button>
        </div>

        {ingredients.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#8E8E93', margin: '10px 0', textAlign: 'center' }}>
            Nessun ingrediente. Usa l AI o aggiungili a mano.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {ingredients.map(ing => (
              <IngredientRow
                key={ing.id}
                ingredient={ing}
                onUpdateGrams={g => handleUpdateGrams(ing.id, g)}
                onRemove={() => handleRemoveIngredient(ing.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* MACRO TOTALS */}
      {ingredients.length > 0 && (
        <div style={cardStyle}>
          <SectionLabel>Totali stimati</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginTop: '10px' }}>
            <MacroBlock label="KCAL" value={Math.round(totals.kcal)} color="#000" />
            <MacroBlock label="PROT" value={Math.round(totals.protein)} unit="g" color="#7CA982" />
            <MacroBlock label="CARB" value={Math.round(totals.carbs)} unit="g" color="#D17A3C" />
            <MacroBlock label="GRASSI" value={Math.round(totals.fat)} unit="g" color="#3B82F6" />
          </div>
        </div>
      )}

      {/* PRIVACY */}
      <PrivacyToggle isPrivate={isPrivate} onChange={setIsPrivate} />

      {/* ERROR + SUBMIT */}
      {error && <ErrorBanner text={error} />}

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={submitBtnStyle(saving)}
      >
        {saving ? 'Pubblicazione...' : 'Pubblica pasto'}
      </button>

      {/* ADD INGREDIENT MODAL */}
      {showAddIngredient && (
        <AddIngredientModal
          onClose={() => setShowAddIngredient(false)}
          onAdd={handleAddIngredient}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* ============ INGREDIENT ROW ============ */
function IngredientRow({
  ingredient,
  onUpdateGrams,
  onRemove,
}: {
  ingredient: Ingredient
  onUpdateGrams: (g: number) => void
  onRemove: () => void
}) {
  const kcal = Math.round((ingredient.kcal_per_100g * ingredient.grams) / 100)
  const sourceLabel =
    ingredient.source === 'ai' ? { text: 'AI', color: '#7CA982', bg: 'rgba(124,169,130,0.15)' } :
    ingredient.source === 'barcode' ? { text: 'SCAN', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' } :
    { text: 'MANUAL', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }

  return (
    <div
      style={{
        background: '#F2F2F7',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#000', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ingredient.name}
          </p>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px',
              background: sourceLabel.bg,
              color: sourceLabel.color,
              letterSpacing: '0.3px',
              flexShrink: 0,
            }}
          >
            {sourceLabel.text}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#8E8E93', margin: 0 }}>
          {kcal} kcal
        </p>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode="numeric"
          value={ingredient.grams}
          onChange={e => onUpdateGrams(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
          style={{
            width: '58px',
            height: '32px',
            padding: '0 24px 0 8px',
            background: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#000',
            textAlign: 'right',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#8E8E93', pointerEvents: 'none' }}>
          g
        </span>
      </div>
      <button
        onClick={onRemove}
        aria-label="Rimuovi"
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
          color: '#FF3B30',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

/* ============ ADD INGREDIENT MODAL ============ */
function AddIngredientModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (food: (typeof FOOD_DB)[0], grams: number) => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<(typeof FOOD_DB)[0] | null>(null)
  const [grams, setGrams] = useState('100')

  const filtered = FOOD_DB.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10)

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
          maxHeight: '80vh',
          overflowY: 'auto',
          paddingBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            background: '#F2F2F7',
            zIndex: 1,
          }}
        >
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '15px', cursor: 'pointer', padding: '8px 0' }}>
            Annulla
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Aggiungi ingrediente</h3>
          <button
            onClick={() => {
              if (selected) onAdd(selected, parseInt(grams) || 100)
            }}
            disabled={!selected}
            style={{
              background: 'none',
              border: 'none',
              color: selected ? '#007AFF' : '#C7C7CC',
              fontSize: '15px',
              fontWeight: 600,
              cursor: selected ? 'pointer' : 'not-allowed',
              padding: '8px 0',
            }}
          >
            Aggiungi
          </button>
        </div>

        <div style={{ padding: '14px 16px' }}>
          {!selected ? (
            <>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8E8E93"
                  strokeWidth="2"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Cerca un alimento..."
                  autoFocus
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px 0 36px',
                    background: '#FFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#000',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filtered.map(f => (
                  <button
                    key={f.name}
                    onClick={() => setSelected(f)}
                    style={{
                      background: '#FFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#000', fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontSize: '12px', color: '#8E8E93' }}>{f.kcal_per_100g} kcal/100g</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p style={{ fontSize: '13px', color: '#8E8E93', textAlign: 'center', padding: '20px 0' }}>
                    Nessun alimento trovato.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div>
              <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>{selected.name}</p>
                <p style={{ fontSize: '12px', color: '#8E8E93', margin: '4px 0 0' }}>
                  {selected.kcal_per_100g} kcal · P {selected.protein_per_100g}g · C {selected.carbs_per_100g}g · F {selected.fat_per_100g}g (per 100g)
                </p>
              </div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Quantit{'\u00E0'} (grammi)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={grams}
                  onChange={e => setGrams(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 40px 0 14px',
                    background: '#FFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    color: '#000',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#8E8E93' }}>
                  g
                </span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                {[50, 100, 150, 200].map(g => (
                  <button
                    key={g}
                    onClick={() => setGrams(String(g))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#007AFF',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {g}g
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSelected(null)}
                style={{
                  width: '100%',
                  marginTop: '14px',
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#007AFF',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {'\u2190'} Torna alla ricerca
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============ WORKOUT FLOW ============ */
function WorkoutFlow({
  user,
  onSaving,
  onError,
  saving,
  error,
  router,
}: {
  user: any
  onSaving: (b: boolean) => void
  onError: (s: string) => void
  saving: boolean
  error: string
  router: ReturnType<typeof useRouter>
}) {
  const [source, setSource] = useState<WorkoutSource>('manuale')
  const [workoutType, setWorkoutType] = useState<WorkoutType>('corsa')
  const [durationMin, setDurationMin] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [heartrate, setHeartrate] = useState('')
  const [notes, setNotes] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  // Auto-calcolo velocita media
  const speedKmh =
    durationMin && distanceKm && parseFloat(durationMin) > 0
      ? (parseFloat(distanceKm) / (parseFloat(durationMin) / 60)).toFixed(1)
      : ''

  const workoutTypes: { v: WorkoutType; l: string; icon: React.ReactNode }[] = [
    { v: 'corsa', l: 'Corsa', icon: <IconRun /> },
    { v: 'bici', l: 'Bici', icon: <IconBike /> },
    { v: 'palestra', l: 'Palestra', icon: <IconGym /> },
    { v: 'camminata', l: 'Camminata', icon: <IconWalk /> },
    { v: 'yoga', l: 'Yoga', icon: <IconYoga /> },
    { v: 'hiit', l: 'HIIT', icon: <IconHiit /> },
    { v: 'nuoto', l: 'Nuoto', icon: <IconSwim /> },
    { v: 'altro', l: 'Altro', icon: <IconDots /> },
  ]

  const handleSubmit = async () => {
    if (!user) return
    if (!durationMin) {
      onError('Inserisci almeno la durata.')
      return
    }
    onSaving(true)
    onError('')

    const { error: insertError } = await supabase.from('posts').insert({
      user_id: user!.id,
      type: 'allenamento',
      is_private: isPrivate,
      workout_type: workoutTypes.find(w => w.v === workoutType)?.l,
      workout_duration_min: parseInt(durationMin) || null,
      workout_distance_km: distanceKm ? parseFloat(distanceKm) : null,
      workout_speed_kmh: speedKmh ? parseFloat(speedKmh) : null,
      workout_heartrate: heartrate ? parseInt(heartrate) : null,
      workout_notes: notes || null,
    })

    if (insertError) {
      onError('Errore salvataggio: ' + insertError.message)
      onSaving(false)
    } else {
      router.push('/feed')
    }
  }

  return (
    <div style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* SOURCE SELECTOR */}
      <div style={cardStyle}>
        <SectionLabel>Sorgente</SectionLabel>
        <div
          style={{
            background: '#F2F2F7',
            borderRadius: '10px',
            padding: '2px',
            display: 'flex',
            marginTop: '8px',
          }}
        >
          <button
            onClick={() => setSource('manuale')}
            style={{
              flex: 1,
              padding: '9px',
              background: source === 'manuale' ? '#FFF' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: source === 'manuale' ? 700 : 500,
              color: source === 'manuale' ? '#000' : '#3C3C43',
              boxShadow: source === 'manuale' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
            }}
          >
            Manuale
          </button>
          <button
            onClick={() => setSource('watch')}
            style={{
              flex: 1,
              padding: '9px',
              background: source === 'watch' ? '#FFF' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: source === 'watch' ? 700 : 500,
              color: source === 'watch' ? '#000' : '#3C3C43',
              boxShadow: source === 'watch' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            Apple Watch
          </button>
        </div>
      </div>

      {source === 'watch' && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1F2421, #3C3C43)',
            borderRadius: '16px',
            padding: '20px',
            color: '#FFF',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" rx="2" />
              <path d="M9 2h6v4H9zM9 18h6v4H9z" />
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Collega Apple Watch</p>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: '6px 0 14px', lineHeight: 1.4 }}>
            Importa automaticamente i tuoi allenamenti. Una volta connesso, potrai scegliere se pubblicarli in automatico.
          </p>
          <button
            style={{
              padding: '10px 24px',
              background: '#FFF',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Collega (in arrivo)
          </button>
        </div>
      )}

      {source === 'manuale' && (
        <>
          {/* WORKOUT TYPE */}
          <div style={cardStyle}>
            <SectionLabel>Tipo allenamento</SectionLabel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                marginTop: '10px',
              }}
            >
              {workoutTypes.map(t => {
                const active = workoutType === t.v
                return (
                  <button
                    key={t.v}
                    onClick={() => setWorkoutType(t.v)}
                    style={{
                      padding: '12px 4px',
                      borderRadius: '10px',
                      background: active ? 'rgba(124, 169, 130, 0.15)' : '#F2F2F7',
                      border: active ? '1.5px solid #7CA982' : '1.5px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      color: active ? '#4F7057' : '#3C3C43',
                    }}
                  >
                    {t.icon}
                    <span style={{ fontSize: '11px', fontWeight: active ? 700 : 500 }}>{t.l}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* DURATION + DISTANCE */}
          <div style={cardStyle}>
            <SectionLabel>Dati</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              <LabeledNumberInput
                label="DURATA"
                value={durationMin}
                onChange={setDurationMin}
                suffix="min"
                required
              />
              <LabeledNumberInput
                label="DISTANZA"
                value={distanceKm}
                onChange={setDistanceKm}
                suffix="km"
                decimal
              />
            </div>

            {speedKmh && (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p style={{ fontSize: '12px', color: '#1E40AF', margin: 0, fontWeight: 500 }}>
                  Velocit{'\u00E0'} media calcolata: {speedKmh} km/h
                </p>
              </div>
            )}

            <div style={{ marginTop: '10px' }}>
              <LabeledNumberInput
                label="BATTITO MEDIO (opzionale)"
                value={heartrate}
                onChange={setHeartrate}
                suffix="bpm"
              />
            </div>
          </div>

          {/* NOTES */}
          <div style={cardStyle}>
            <SectionLabel>Note</SectionLabel>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Come stai? Sensazioni, obiettivi, record..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                fontSize: '15px',
                color: '#000',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.4,
                marginTop: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <PrivacyToggle isPrivate={isPrivate} onChange={setIsPrivate} />

          {error && <ErrorBanner text={error} />}

          <button onClick={handleSubmit} disabled={saving} style={submitBtnStyle(saving)}>
            {saving ? 'Pubblicazione...' : 'Pubblica allenamento'}
          </button>
        </>
      )}
    </div>
  )
}

/* ============ SHARED COMPONENTS ============ */

const cardStyle: React.CSSProperties = {
  background: '#FFF',
  borderRadius: '14px',
  padding: '14px 16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.5px', margin: 0, textTransform: 'uppercase' }}>
      {children}
    </p>
  )
}

function LabeledNumberInput({
  label,
  value,
  onChange,
  suffix,
  decimal,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix?: string
  decimal?: boolean
  required?: boolean
}) {
  return (
    <div>
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.5px', margin: '0 0 6px' }}>
        {label}
        {required && <span style={{ color: '#FF3B30', marginLeft: '4px' }}>*</span>}
      </p>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          value={value}
          onChange={e => {
            const cleaned = decimal
              ? e.target.value.replace(/[^\d.,]/g, '').replace(',', '.')
              : e.target.value.replace(/\D/g, '')
            onChange(cleaned)
          }}
          placeholder="0"
          style={{
            width: '100%',
            height: '44px',
            padding: suffix ? '0 40px 0 12px' : '0 12px',
            background: '#F2F2F7',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#000',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8E8E93', fontWeight: 500, pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function MacroBlock({ label, value, unit, color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div style={{ background: '#F2F2F7', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}>
      <p style={{ fontSize: '9px', fontWeight: 700, color, letterSpacing: '0.5px', margin: 0 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px', marginTop: '3px' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{value}</span>
        {unit && <span style={{ fontSize: '10px', color: '#8E8E93' }}>{unit}</span>}
      </div>
    </div>
  )
}

function PrivacyToggle({ isPrivate, onChange }: { isPrivate: boolean; onChange: (p: boolean) => void }) {
  return (
    <div
      style={{
        background: '#FFF',
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>
          {isPrivate ? 'Post privato' : 'Post pubblico'}
        </p>
        <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>
          {isPrivate ? 'Visibile solo a te' : 'Visibile nella community'}
        </p>
      </div>
      <button
        onClick={() => onChange(!isPrivate)}
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
            top: '2px',
            left: isPrivate ? '2px' : '22px',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#FFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'rgba(255, 59, 48, 0.08)',
        borderRadius: '10px',
        padding: '10px 12px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF3B30" style={{ flexShrink: 0, marginTop: '1px' }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" stroke="#FFF" strokeWidth="2" />
        <circle cx="12" cy="16" r="1" fill="#FFF" />
      </svg>
      <p style={{ fontSize: '13px', color: '#C53030', margin: 0, lineHeight: 1.4 }}>{text}</p>
    </div>
  )
}

function submitBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    height: '52px',
    background: disabled ? '#C7C7CC' : '#7CA982',
    color: '#FFF',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '4px',
    boxShadow: disabled ? 'none' : '0 2px 8px rgba(124, 169, 130, 0.3)',
  }
}

/* ============ WORKOUT ICONS ============ */
function IconRun() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2" /><path d="M10 17l3-3 3 3M7 21l3.5-5L15 20M15 9l3 2 3-1M6 11l4-1" /></svg>) }
function IconBike() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5l-3-6 4-3 4 4h3" /></svg>) }
function IconGym() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M2 8h4M2 16h4M18 8h4M18 16h4M6 12h12" /></svg>) }
function IconWalk() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2" /><path d="M11 21v-7l-2-2 3-6 2 5 4 2M9 14l-2 7" /></svg>) }
function IconYoga() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2" /><path d="M6 20l6-4 6 4M12 8v8M4 14l4 2M20 14l-4 2" /></svg>) }
function IconHiit() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>) }
function IconSwim() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1M2 14c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1" /><circle cx="16" cy="7" r="2" /></svg>) }
function IconDots() { return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>) }
