"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PostData } from './PostCard'

type Ingredient = {
  id: string
  name: string
  grams: number
  kcal_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  source: string
}

export default function MealPostBody({ post }: { post: PostData }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIngredients()
  }, [post.id])

  const loadIngredients = async () => {
    const { data } = await supabase
      .from('post_ingredients')
      .select('*')
      .eq('post_id', post.id)
      .order('position', { ascending: true })
    setIngredients(data || [])
    setLoading(false)
  }

  // Calcolo totali macro
  const totals = ingredients.reduce(
    (acc, ing) => ({
      kcal: acc.kcal + (Number(ing.kcal_per_100g) * Number(ing.grams)) / 100,
      protein: acc.protein + (Number(ing.protein_per_100g) * Number(ing.grams)) / 100,
      carbs: acc.carbs + (Number(ing.carbs_per_100g) * Number(ing.grams)) / 100,
      fat: acc.fat + (Number(ing.fat_per_100g) * Number(ing.grams)) / 100,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const mealTypeLabel = post.meal_type
    ? post.meal_type.charAt(0).toUpperCase() + post.meal_type.slice(1)
    : null

  return (
    <div style={{ padding: '0 14px 12px' }}>
      {/* Foto pasto */}
      {post.meal_photo_url && (
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '10px',
            aspectRatio: '4/3',
          }}
        >
          <img
            src={post.meal_photo_url}
            alt="Pasto"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Badge tipo pasto + caption */}
      {mealTypeLabel && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            background: 'rgba(209, 122, 60, 0.12)',
            borderRadius: '8px',
            marginBottom: '8px',
          }}
        >
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D17A3C' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#B85A1F' }}>{mealTypeLabel}</span>
        </div>
      )}

      {/* Caption / descrizione */}
      {post.meal_description && (
        <p
          style={{
            fontSize: '14px',
            color: '#000',
            margin: '4px 0 12px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.meal_description}
        </p>
      )}

      {/* Griglia ingredienti */}
      {ingredients.length > 0 && (
        <>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#8E8E93',
              letterSpacing: '0.4px',
              margin: '0 0 6px',
              textTransform: 'uppercase',
            }}
          >
            Ingredienti
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            {ingredients.map(ing => (
              <IngredientCard key={ing.id} ingredient={ing} />
            ))}
          </div>
        </>
      )}

      {/* Macro totals card */}
      {ingredients.length > 0 && totals.kcal > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1F2421, #3C3C43)',
            borderRadius: '12px',
            padding: '12px',
            color: '#FFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', margin: 0, opacity: 0.8 }}>
              TOTALI STIMATI
            </p>
            <p style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
              {Math.round(totals.kcal)} <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 500 }}>kcal</span>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <MacroMiniBar label="PROT" value={Math.round(totals.protein)} color="#7CA982" />
            <MacroMiniBar label="CARB" value={Math.round(totals.carbs)} color="#D17A3C" />
            <MacroMiniBar label="GRASSI" value={Math.round(totals.fat)} color="#3B82F6" />
          </div>
        </div>
      )}
    </div>
  )
}

function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const kcal = Math.round((Number(ingredient.kcal_per_100g) * Number(ingredient.grams)) / 100)
  const color = ingredientColor(ingredient.name)
  const sourceIcon =
    ingredient.source === 'ai' ? '\u2728' : ingredient.source === 'barcode' ? '\uD83D\uDCF1' : null

  return (
    <div
      style={{
        background: color.bg,
        borderRadius: '10px',
        padding: '8px 10px',
        border: '1px solid ' + color.border,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
        {sourceIcon && <span style={{ fontSize: '9px' }}>{sourceIcon}</span>}
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: color.text,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {ingredient.name}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: color.text }}>
          {Number(ingredient.grams)}<span style={{ fontSize: '10px', fontWeight: 500, marginLeft: '1px' }}>g</span>
        </span>
        <span style={{ fontSize: '10px', color: color.text, opacity: 0.75 }}>
          {kcal} kcal
        </span>
      </div>
    </div>
  )
}

function MacroMiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '6px 8px',
      }}
    >
      <p style={{ fontSize: '9px', fontWeight: 700, color, letterSpacing: '0.5px', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', margin: '2px 0 0' }}>
        {value}<span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 500 }}>g</span>
      </p>
    </div>
  )
}

// Colore ingredienti basato su categoria semantica
function ingredientColor(name: string): { bg: string; border: string; text: string } {
  const lower = name.toLowerCase()
  // Carni e pesci (rame)
  if (/pollo|manzo|vitello|maiale|salmone|tonno|pesce|uov[ao]|carne|tacchino|bresaola|prosciutto/.test(lower)) {
    return { bg: 'rgba(209, 122, 60, 0.1)', border: 'rgba(209, 122, 60, 0.3)', text: '#9C4E1E' }
  }
  // Cereali e carbo (ocra)
  if (/riso|pasta|pane|avena|orzo|farro|quinoa|pizza|cous|cereali/.test(lower)) {
    return { bg: 'rgba(232, 168, 87, 0.15)', border: 'rgba(232, 168, 87, 0.35)', text: '#8B5A1B' }
  }
  // Verdura (verde)
  if (/insalata|spinaci|broccoli|zucchin|verdur|pomodor|carote|cavol|lattug|rucola|cetriol/.test(lower)) {
    return { bg: 'rgba(124, 169, 130, 0.12)', border: 'rgba(124, 169, 130, 0.3)', text: '#3F6B47' }
  }
  // Frutta (viola/rosa)
  if (/mel[ae]|banan|fragol|frutt|pesch|ananas|uva|arancia|kiwi|mirtill|avocad/.test(lower)) {
    return { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#6B21A8' }
  }
  // Latticini (blu chiaro)
  if (/yogurt|latt|formaggi|ricott|mozzarel|parmig|grana|burro/.test(lower)) {
    return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#1E40AF' }
  }
  // Grassi (giallo/oro)
  if (/oli[oa]|mandorl|noci|semi|burro|nutella/.test(lower)) {
    return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', text: '#92400E' }
  }
  // Legumi (verde scuro)
  if (/legumi|ceci|fagiol|lenticchi|piseli/.test(lower)) {
    return { bg: 'rgba(91, 140, 123, 0.12)', border: 'rgba(91, 140, 123, 0.3)', text: '#365943' }
  }
  // Default (grigio)
  return { bg: 'rgba(142, 142, 147, 0.1)', border: 'rgba(142, 142, 147, 0.25)', text: '#1F2421' }
}
