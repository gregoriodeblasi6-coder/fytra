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

export default function MealPostBody({
  post,
  mode = 'preview',
  isOwner = false,
}: {
  post: PostData
  mode?: 'preview' | 'full'
  isOwner?: boolean
}) {
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

  /* ===== PREVIEW MODE (feed) ===== */
  if (mode === 'preview') {
    const previewIngr = ingredients.slice(0, 3)
    const extraCount = ingredients.length - previewIngr.length

    return (
      <div>
        {post.meal_photo_url && (
          <div style={{ width: '100%', maxHeight: '500px', overflow: 'hidden', background: '#F2F2F7' }}>
            <img
              src={post.meal_photo_url}
              alt="Pasto"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '500px', objectFit: 'contain' }}
            />
          </div>
        )}

        <div style={{ padding: '10px 14px 8px' }}>
          {mealTypeLabel && (
            <div style={{ marginBottom: post.meal_description || ingredients.length > 0 ? '6px' : 0 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  background: 'rgba(209, 122, 60, 0.12)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#B85A1F',
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D17A3C' }} />
                {mealTypeLabel}
              </span>
            </div>
          )}

          {post.meal_description && (
            <p
              style={{
                fontSize: '14px',
                color: '#000',
                margin: '0 0 8px',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {post.meal_description}
            </p>
          )}

          {ingredients.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {previewIngr.map(ing => (
                <span
                  key={ing.id}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: '#F2F2F7',
                    color: '#3C3C43',
                    borderRadius: '6px',
                    fontWeight: 500,
                  }}
                >
                  {ing.name}
                </span>
              ))}
              {extraCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: '#F2F2F7',
                    color: '#8E8E93',
                    borderRadius: '6px',
                    fontWeight: 500,
                  }}
                >
                  +{extraCount} altri
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ===== FULL MODE (pagina dettaglio) ===== */
  return (
    <div>
      {post.meal_photo_url && (
        <div style={{ width: '100%', maxHeight: '600px', overflow: 'hidden', background: '#F2F2F7' }}>
          <img
            src={post.meal_photo_url}
            alt="Pasto"
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '600px', objectFit: 'contain' }}
          />
        </div>
      )}

      <div style={{ padding: '12px 14px 14px' }}>
        {mealTypeLabel && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              background: 'rgba(209, 122, 60, 0.12)',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D17A3C' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#B85A1F' }}>{mealTypeLabel}</span>
          </div>
        )}

        {post.meal_description && (
          <p style={{ fontSize: '14px', color: '#000', margin: '4px 0 14px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {post.meal_description}
          </p>
        )}

        {ingredients.length > 0 && (
          <>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.4px', margin: '0 0 6px', textTransform: 'uppercase' }}>
              Ingredienti
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '10px' }}>
              {ingredients.map(ing => (
                <IngredientCard key={ing.id} ingredient={ing} showQuantity={isOwner} />
              ))}
            </div>
          </>
        )}

        {isOwner && ingredients.length > 0 && totals.kcal > 0 && (
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
                TOTALI (solo tu)
              </p>
              <p style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                {formatKcal(totals.kcal)} <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 500 }}>kcal</span>
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <MacroMiniBar label="PROT" value={formatGrams(totals.protein)} color="#7CA982" />
              <MacroMiniBar label="CARB" value={formatGrams(totals.carbs)} color="#D17A3C" />
              <MacroMiniBar label="GRASSI" value={formatGrams(totals.fat)} color="#3B82F6" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function IngredientCard({ ingredient, showQuantity }: { ingredient: Ingredient; showQuantity: boolean }) {
  const kcal = Math.round((Number(ingredient.kcal_per_100g) * Number(ingredient.grams)) / 100)
  const color = ingredientColor(ingredient.name)
  const sourceIcon =
    ingredient.source === 'ai' ? '\u2728' : ingredient.source === 'barcode' ? '\uD83D\uDCF1' : null

  return (
    <div style={{ background: color.bg, borderRadius: '10px', padding: '8px 10px', border: '1px solid ' + color.border, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: showQuantity ? '2px' : 0 }}>
        {sourceIcon && <span style={{ fontSize: '9px' }}>{sourceIcon}</span>}
        <p style={{ fontSize: '12px', fontWeight: 600, color: color.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {ingredient.name}
        </p>
      </div>
      {showQuantity && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: color.text }}>
            {formatWeight(Number(ingredient.grams), ingredient.name)}
          </span>
          <span style={{ fontSize: '10px', color: color.text, opacity: 0.75 }}>
            {formatKcal(kcal)} kcal
          </span>
        </div>
      )}
    </div>
  )
}

function MacroMiniBar({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 8px' }}>
      <p style={{ fontSize: '9px', fontWeight: 700, color, letterSpacing: '0.5px', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', margin: '2px 0 0' }}>{value}</p>
    </div>
  )
}

export function formatKcal(n: number): string {
  n = Math.round(n)
  if (n < 1000) return String(n)
  if (n < 10000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  if (n < 1000000) return Math.round(n / 1000) + 'k'
  if (n < 10000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  return Math.round(n / 1000000) + 'M'
}

export function formatGrams(n: number): string {
  n = Math.round(n)
  if (n < 1000) return n + 'g'
  if (n < 10000) return (n / 1000).toFixed(1).replace('.0', '') + 'kg'
  return Math.round(n / 1000) + 'kg'
}

export function formatWeight(n: number, name?: string): string {
  const isLiquid = name ? /acqua|latte|succo|caff|the|te|birra|vino|olio|cola|bibita/.test(name.toLowerCase()) : false
  const unit = isLiquid ? 'ml' : 'g'
  const bigUnit = isLiquid ? 'L' : 'kg'
  if (n < 1000) return n + unit
  if (n < 10000) return (n / 1000).toFixed(1).replace('.0', '') + bigUnit
  return Math.round(n / 1000) + bigUnit
}

function ingredientColor(name: string): { bg: string; border: string; text: string } {
  const lower = name.toLowerCase()
  if (/pollo|manzo|vitello|maiale|salmone|tonno|pesce|uov[ao]|carne|tacchino|bresaola|prosciutto|bacon|salame/.test(lower)) {
    return { bg: 'rgba(209, 122, 60, 0.1)', border: 'rgba(209, 122, 60, 0.3)', text: '#9C4E1E' }
  }
  if (/riso|pasta|pane|avena|orzo|farro|quinoa|pizza|cous|cereali|focaccia|piadin|crackers/.test(lower)) {
    return { bg: 'rgba(232, 168, 87, 0.15)', border: 'rgba(232, 168, 87, 0.35)', text: '#8B5A1B' }
  }
  if (/insalata|spinaci|broccoli|zucchin|verdur|pomodor|carote|cavol|lattug|rucola|cetriol|melanzan|peperon|radicchi|asparag/.test(lower)) {
    return { bg: 'rgba(124, 169, 130, 0.12)', border: 'rgba(124, 169, 130, 0.3)', text: '#3F6B47' }
  }
  if (/mel[ae]|banan|fragol|frutt|pesch|ananas|uva|arancia|kiwi|mirtill|avocad|ciliegi|albicoc|lampon/.test(lower)) {
    return { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#6B21A8' }
  }
  if (/yogurt|latt|formaggi|ricott|mozzarel|parmig|grana|burro|stracchin|feta/.test(lower)) {
    return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#1E40AF' }
  }
  if (/oli[oa]|mandorl|noci|semi|nutella|pistacch|anacard|nocciol/.test(lower)) {
    return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', text: '#92400E' }
  }
  if (/legumi|ceci|fagiol|lenticchi|piseli|fave|tofu|edamame|tempeh/.test(lower)) {
    return { bg: 'rgba(91, 140, 123, 0.12)', border: 'rgba(91, 140, 123, 0.3)', text: '#365943' }
  }
  return { bg: 'rgba(142, 142, 147, 0.1)', border: 'rgba(142, 142, 147, 0.25)', text: '#1F2421' }
}
