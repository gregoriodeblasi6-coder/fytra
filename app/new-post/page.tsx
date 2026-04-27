"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

type PostType = 'pasto' | 'allenamento' | null
type WorkoutSource = 'manuale' | 'watch'
type MealType = 'colazione' | 'pranzo' | 'cena' | 'snack'
type WorkoutType = 'corsa' | 'bici' | 'palestra' | 'camminata' | 'yoga' | 'hiit' | 'nuoto' | 'calcio' | 'tennis' | 'padel' | 'basket' | 'pallavolo' | 'pilates' | 'crossfit' | 'boxe' | 'arti_marziali' | 'sci' | 'snowboard' | 'surf' | 'arrampicata' | 'rugby' | 'danza' | 'escursionismo' | 'altro'

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

// Utente taggato in un post (mention per pasti, coworkout per allenamenti)
type TaggedUser = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  tag_type: 'mention' | 'coworkout'
}

// Profilo bevanda: unita' domestiche disponibili per quella bevanda
// Restituisce null se l'alimento NON e' una bevanda (usa grammi normali)
type DrinkUnit = { label: string; ml: number; emoji: string }
function getDrinkProfile(name: string): DrinkUnit[] | null {
  const lower = name.toLowerCase()

  // Caffe / espresso → tazzina, tazza grande
  if (/caff[e\u00E8]|espresso/.test(lower)) {
    return [
      { label: 'Tazzina', ml: 50, emoji: '\u2615' },
      { label: 'Tazza', ml: 200, emoji: '\u2615' },
      { label: 'Bicchiere', ml: 250, emoji: '\uD83E\uDD43' },
    ]
  }

  // The / camomilla / tisane → tazza
  if (/the|tisana|camomilla|infuso/.test(lower)) {
    return [
      { label: 'Tazza', ml: 200, emoji: '\uD83C\uDF75' },
      { label: 'Bicchiere', ml: 250, emoji: '\uD83E\uDD43' },
    ]
  }

  // Vino → calice, bicchiere
  if (/vino/.test(lower)) {
    return [
      { label: 'Calice', ml: 150, emoji: '\uD83C\uDF77' },
      { label: 'Bicchiere', ml: 200, emoji: '\uD83E\uDD43' },
      { label: 'Bottiglia', ml: 750, emoji: '\uD83C\uDF7E' },
    ]
  }

  // Birra → calice, lattina, boccale, bottiglia
  if (/birra/.test(lower)) {
    return [
      { label: 'Lattina', ml: 330, emoji: '\uD83C\uDF7A' },
      { label: 'Bottiglia', ml: 330, emoji: '\uD83C\uDF7A' },
      { label: 'Calice', ml: 200, emoji: '\uD83C\uDF7A' },
      { label: 'Boccale', ml: 500, emoji: '\uD83C\uDF7A' },
    ]
  }

  // Bibite gassate → lattina, bottiglietta, bottiglia
  if (/cola|bibita|aranciata|gazzosa|sprite|fanta|chinotto|tonica/.test(lower)) {
    return [
      { label: 'Lattina', ml: 330, emoji: '\uD83C\uDF7E' },
      { label: 'Bottiglietta', ml: 500, emoji: '\uD83C\uDF7E' },
      { label: 'Bicchiere', ml: 250, emoji: '\uD83E\uDD43' },
    ]
  }

  // Succhi e centrifughe
  if (/succo|spremuta|centrifug|smoothie|frullato/.test(lower)) {
    return [
      { label: 'Bicchiere', ml: 200, emoji: '\uD83E\uDD64' },
      { label: 'Bottiglietta', ml: 250, emoji: '\uD83E\uDD64' },
    ]
  }

  // Latte
  if (/latte(?! di mandorl| di cocco| di soia)/.test(lower) && !/latticini|formag/.test(lower)) {
    return [
      { label: 'Bicchiere', ml: 200, emoji: '\uD83E\uDD5B' },
      { label: 'Tazza', ml: 250, emoji: '\uD83E\uDD5B' },
    ]
  }

  // Acqua
  if (/acqua/.test(lower)) {
    return [
      { label: 'Bicchiere', ml: 250, emoji: '\uD83E\uDD43' },
      { label: 'Bottiglietta', ml: 500, emoji: '\uD83D\uDCA7' },
      { label: 'Bottiglia', ml: 1500, emoji: '\uD83D\uDCA7' },
    ]
  }

  return null
}

// Categoria dedotta dal nome — usata per raggruppare nella modale ricerca
function getCategory(name: string): string {
  const lower = name.toLowerCase()
  if (/pollo|manzo|vitello|maiale|tacchino|bresaola|prosciutto|bacon|salame|mortadell|carne/.test(lower)) return 'Carni e salumi'
  if (/salmone|tonno|orata|branzino|merluzzo|gamberi|calamari|acciugh|pesce/.test(lower)) return 'Pesce'
  if (/uov[ao]|albume|latte|yogurt|formaggi|ricott|mozzarel|parmig|grana|stracchin|feta|burro/.test(lower)) return 'Uova e latticini'
  if (/riso|pasta|pane|avena|orzo|farro|quinoa|pizza|cous|cereali|focaccia|piadin|crackers|gnocchi/.test(lower)) return 'Cereali e derivati'
  if (/insalata|spinaci|broccoli|zucchin|verdur|pomodor|carote|cavol|lattug|rucola|cetriol|melanzan|peperon|radicchi|asparag|cipolla|funghi|patate/.test(lower)) return 'Verdure'
  if (/mel[ae]|banan|fragol|frutt|pesch|ananas|uva|arancia|kiwi|mirtill|avocad|ciliegi|albicoc|lampon/.test(lower)) return 'Frutta'
  if (/ceci|fagiol|lenticchi|piseli|fave|tofu|edamame|tempeh|legumi/.test(lower)) return 'Legumi'
  if (/mandorl|noci|pistacch|anacard|nocciol|semi/.test(lower)) return 'Frutta secca'
  if (/oli|miele|marmellata|nutella|zucchero/.test(lower)) return 'Condimenti e dolci'
  if (/caff|the|te|birra|vino|cola|bibita|succo/.test(lower)) return 'Bevande'
  return 'Altro'
}

// Ordine visualizzazione categorie
const CATEGORY_ORDER = [
  'Cereali e derivati',
  'Carni e salumi',
  'Pesce',
  'Uova e latticini',
  'Verdure',
  'Legumi',
  'Frutta',
  'Frutta secca',
  'Condimenti e dolci',
  'Bevande',
  'Altro',
]

// Mini database alimenti (valori medi USDA/CREA per 100g)
const FOOD_DB: Array<Omit<Ingredient, 'id' | 'grams' | 'source'>> = [
  // Cereali e derivati
  { name: 'Riso bianco cotto', kcal_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
  { name: 'Riso integrale cotto', kcal_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9 },
  { name: 'Pasta cotta', kcal_per_100g: 158, protein_per_100g: 5.8, carbs_per_100g: 31, fat_per_100g: 0.9 },
  { name: 'Pasta integrale cotta', kcal_per_100g: 149, protein_per_100g: 6.3, carbs_per_100g: 28, fat_per_100g: 1.6 },
  { name: 'Pane bianco', kcal_per_100g: 265, protein_per_100g: 9, carbs_per_100g: 49, fat_per_100g: 3.2 },
  { name: 'Pane integrale', kcal_per_100g: 247, protein_per_100g: 13, carbs_per_100g: 41, fat_per_100g: 3.4 },
  { name: 'Pizza margherita', kcal_per_100g: 266, protein_per_100g: 11, carbs_per_100g: 33, fat_per_100g: 10 },
  { name: 'Focaccia', kcal_per_100g: 285, protein_per_100g: 7.5, carbs_per_100g: 48, fat_per_100g: 6.8 },
  { name: 'Piadina', kcal_per_100g: 312, protein_per_100g: 8, carbs_per_100g: 51, fat_per_100g: 8 },
  { name: 'Crackers', kcal_per_100g: 428, protein_per_100g: 10, carbs_per_100g: 69, fat_per_100g: 12 },
  { name: 'Cereali colazione', kcal_per_100g: 378, protein_per_100g: 7, carbs_per_100g: 84, fat_per_100g: 1.7 },
  { name: 'Avena fiocchi', kcal_per_100g: 389, protein_per_100g: 16.9, carbs_per_100g: 66, fat_per_100g: 6.9 },
  { name: 'Orzo perlato cotto', kcal_per_100g: 123, protein_per_100g: 2.3, carbs_per_100g: 28, fat_per_100g: 0.4 },
  { name: 'Farro cotto', kcal_per_100g: 127, protein_per_100g: 5.5, carbs_per_100g: 25, fat_per_100g: 0.8 },
  { name: 'Quinoa cotta', kcal_per_100g: 120, protein_per_100g: 4.4, carbs_per_100g: 21, fat_per_100g: 1.9 },
  { name: 'Cous cous cotto', kcal_per_100g: 112, protein_per_100g: 3.8, carbs_per_100g: 23, fat_per_100g: 0.2 },
  { name: 'Gnocchi di patate', kcal_per_100g: 173, protein_per_100g: 4, carbs_per_100g: 34, fat_per_100g: 1.9 },
  // Carni
  { name: 'Petto di pollo', kcal_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { name: 'Coscia di pollo', kcal_per_100g: 209, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 11 },
  { name: 'Tacchino petto', kcal_per_100g: 135, protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 1 },
  { name: 'Manzo magro', kcal_per_100g: 143, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 4 },
  { name: 'Vitello', kcal_per_100g: 107, protein_per_100g: 21, carbs_per_100g: 0, fat_per_100g: 2.8 },
  { name: 'Maiale magro', kcal_per_100g: 143, protein_per_100g: 21, carbs_per_100g: 0, fat_per_100g: 6 },
  { name: 'Bresaola', kcal_per_100g: 151, protein_per_100g: 32, carbs_per_100g: 0.4, fat_per_100g: 2.4 },
  { name: 'Prosciutto crudo', kcal_per_100g: 267, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 18 },
  { name: 'Prosciutto cotto', kcal_per_100g: 215, protein_per_100g: 20, carbs_per_100g: 1, fat_per_100g: 14.7 },
  { name: 'Salame', kcal_per_100g: 407, protein_per_100g: 22, carbs_per_100g: 1, fat_per_100g: 35 },
  { name: 'Mortadella', kcal_per_100g: 288, protein_per_100g: 14, carbs_per_100g: 1, fat_per_100g: 25 },
  // Pesce
  { name: 'Salmone', kcal_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13 },
  { name: 'Tonno al naturale', kcal_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1 },
  { name: 'Tonno fresco', kcal_per_100g: 144, protein_per_100g: 23, carbs_per_100g: 0, fat_per_100g: 5 },
  { name: 'Orata', kcal_per_100g: 121, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 4.5 },
  { name: 'Branzino', kcal_per_100g: 97, protein_per_100g: 17, carbs_per_100g: 0, fat_per_100g: 3 },
  { name: 'Merluzzo', kcal_per_100g: 82, protein_per_100g: 18, carbs_per_100g: 0, fat_per_100g: 0.7 },
  { name: 'Gamberi', kcal_per_100g: 71, protein_per_100g: 13, carbs_per_100g: 0.2, fat_per_100g: 1.4 },
  { name: 'Calamari', kcal_per_100g: 92, protein_per_100g: 15.6, carbs_per_100g: 3, fat_per_100g: 1.4 },
  { name: 'Acciughe', kcal_per_100g: 96, protein_per_100g: 17, carbs_per_100g: 0, fat_per_100g: 2.6 },
  // Uova e latticini
  { name: 'Uova', kcal_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  { name: 'Albume uova', kcal_per_100g: 52, protein_per_100g: 10.9, carbs_per_100g: 0.7, fat_per_100g: 0.2 },
  { name: 'Latte intero', kcal_per_100g: 64, protein_per_100g: 3.3, carbs_per_100g: 4.9, fat_per_100g: 3.6 },
  { name: 'Latte scremato', kcal_per_100g: 36, protein_per_100g: 3.5, carbs_per_100g: 5.3, fat_per_100g: 0.2 },
  { name: 'Yogurt greco', kcal_per_100g: 97, protein_per_100g: 9, carbs_per_100g: 3.6, fat_per_100g: 5 },
  { name: 'Yogurt bianco', kcal_per_100g: 66, protein_per_100g: 3.8, carbs_per_100g: 4.7, fat_per_100g: 3.5 },
  { name: 'Mozzarella', kcal_per_100g: 253, protein_per_100g: 18.7, carbs_per_100g: 0.7, fat_per_100g: 19.5 },
  { name: 'Parmigiano', kcal_per_100g: 392, protein_per_100g: 36, carbs_per_100g: 4, fat_per_100g: 26 },
  { name: 'Ricotta', kcal_per_100g: 174, protein_per_100g: 11, carbs_per_100g: 3, fat_per_100g: 13 },
  { name: 'Stracchino', kcal_per_100g: 300, protein_per_100g: 18, carbs_per_100g: 0.8, fat_per_100g: 25 },
  { name: 'Feta', kcal_per_100g: 264, protein_per_100g: 14, carbs_per_100g: 4, fat_per_100g: 21 },
  { name: 'Burro', kcal_per_100g: 717, protein_per_100g: 0.9, carbs_per_100g: 0.1, fat_per_100g: 81 },
  // Verdure
  { name: 'Pomodori', kcal_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2 },
  { name: 'Insalata mista', kcal_per_100g: 20, protein_per_100g: 1.5, carbs_per_100g: 3, fat_per_100g: 0.3 },
  { name: 'Lattuga', kcal_per_100g: 15, protein_per_100g: 1.4, carbs_per_100g: 2.9, fat_per_100g: 0.2 },
  { name: 'Rucola', kcal_per_100g: 25, protein_per_100g: 2.6, carbs_per_100g: 3.7, fat_per_100g: 0.7 },
  { name: 'Spinaci', kcal_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
  { name: 'Broccoli', kcal_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4 },
  { name: 'Zucchine', kcal_per_100g: 17, protein_per_100g: 1.2, carbs_per_100g: 3.1, fat_per_100g: 0.3 },
  { name: 'Melanzane', kcal_per_100g: 25, protein_per_100g: 1, carbs_per_100g: 5.9, fat_per_100g: 0.2 },
  { name: 'Peperoni', kcal_per_100g: 26, protein_per_100g: 1, carbs_per_100g: 6.3, fat_per_100g: 0.3 },
  { name: 'Carote', kcal_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 9.6, fat_per_100g: 0.2 },
  { name: 'Cetrioli', kcal_per_100g: 16, protein_per_100g: 0.7, carbs_per_100g: 3.6, fat_per_100g: 0.1 },
  { name: 'Cipolla', kcal_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9.3, fat_per_100g: 0.1 },
  { name: 'Patate lesse', kcal_per_100g: 87, protein_per_100g: 1.9, carbs_per_100g: 20, fat_per_100g: 0.1 },
  { name: 'Patate fritte', kcal_per_100g: 312, protein_per_100g: 3.4, carbs_per_100g: 41, fat_per_100g: 15 },
  { name: 'Funghi', kcal_per_100g: 22, protein_per_100g: 3.1, carbs_per_100g: 3.3, fat_per_100g: 0.3 },
  { name: 'Radicchio', kcal_per_100g: 13, protein_per_100g: 1, carbs_per_100g: 1.6, fat_per_100g: 0.2 },
  { name: 'Cavolfiore', kcal_per_100g: 25, protein_per_100g: 1.9, carbs_per_100g: 5, fat_per_100g: 0.3 },
  // Frutta
  { name: 'Mela', kcal_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2 },
  { name: 'Banana', kcal_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
  { name: 'Fragole', kcal_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 7.7, fat_per_100g: 0.3 },
  { name: 'Arancia', kcal_per_100g: 47, protein_per_100g: 0.9, carbs_per_100g: 12, fat_per_100g: 0.1 },
  { name: 'Pesca', kcal_per_100g: 39, protein_per_100g: 0.9, carbs_per_100g: 9.5, fat_per_100g: 0.3 },
  { name: 'Kiwi', kcal_per_100g: 61, protein_per_100g: 1.1, carbs_per_100g: 15, fat_per_100g: 0.5 },
  { name: 'Ananas', kcal_per_100g: 50, protein_per_100g: 0.5, carbs_per_100g: 13, fat_per_100g: 0.1 },
  { name: 'Uva', kcal_per_100g: 69, protein_per_100g: 0.7, carbs_per_100g: 18, fat_per_100g: 0.2 },
  { name: 'Mirtilli', kcal_per_100g: 57, protein_per_100g: 0.7, carbs_per_100g: 14, fat_per_100g: 0.3 },
  { name: 'Avocado', kcal_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15 },
  // Legumi
  { name: 'Ceci cotti', kcal_per_100g: 164, protein_per_100g: 9, carbs_per_100g: 27, fat_per_100g: 2.6 },
  { name: 'Fagioli cotti', kcal_per_100g: 132, protein_per_100g: 8.7, carbs_per_100g: 24, fat_per_100g: 0.5 },
  { name: 'Lenticchie cotte', kcal_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.4 },
  { name: 'Piselli', kcal_per_100g: 81, protein_per_100g: 5.4, carbs_per_100g: 14, fat_per_100g: 0.4 },
  { name: 'Fave', kcal_per_100g: 72, protein_per_100g: 5.5, carbs_per_100g: 11, fat_per_100g: 0.6 },
  { name: 'Tofu', kcal_per_100g: 76, protein_per_100g: 8, carbs_per_100g: 1.9, fat_per_100g: 4.8 },
  { name: 'Edamame', kcal_per_100g: 121, protein_per_100g: 11, carbs_per_100g: 9, fat_per_100g: 5 },
  // Frutta secca e semi
  { name: 'Mandorle', kcal_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
  { name: 'Noci', kcal_per_100g: 654, protein_per_100g: 15, carbs_per_100g: 14, fat_per_100g: 65 },
  { name: 'Pistacchi', kcal_per_100g: 562, protein_per_100g: 20, carbs_per_100g: 28, fat_per_100g: 45 },
  { name: 'Anacardi', kcal_per_100g: 553, protein_per_100g: 18, carbs_per_100g: 30, fat_per_100g: 44 },
  { name: 'Nocciole', kcal_per_100g: 628, protein_per_100g: 15, carbs_per_100g: 17, fat_per_100g: 61 },
  { name: 'Semi di chia', kcal_per_100g: 486, protein_per_100g: 17, carbs_per_100g: 42, fat_per_100g: 31 },
  { name: 'Semi di lino', kcal_per_100g: 534, protein_per_100g: 18, carbs_per_100g: 29, fat_per_100g: 42 },
  // Grassi e condimenti
  { name: 'Olio extravergine', kcal_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
  { name: 'Olio di semi', kcal_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
  { name: 'Miele', kcal_per_100g: 304, protein_per_100g: 0.3, carbs_per_100g: 82, fat_per_100g: 0 },
  { name: 'Marmellata', kcal_per_100g: 250, protein_per_100g: 0.4, carbs_per_100g: 62, fat_per_100g: 0.1 },
  { name: 'Nutella', kcal_per_100g: 539, protein_per_100g: 6.3, carbs_per_100g: 57, fat_per_100g: 31 },
  { name: 'Zucchero', kcal_per_100g: 387, protein_per_100g: 0, carbs_per_100g: 100, fat_per_100g: 0 },
  // Bevande
  { name: 'Caffe amaro', kcal_per_100g: 2, protein_per_100g: 0.1, carbs_per_100g: 0, fat_per_100g: 0 },
  { name: 'The verde', kcal_per_100g: 1, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0 },
  { name: 'Birra', kcal_per_100g: 43, protein_per_100g: 0.5, carbs_per_100g: 3.6, fat_per_100g: 0 },
  { name: 'Vino rosso', kcal_per_100g: 85, protein_per_100g: 0.1, carbs_per_100g: 2.6, fat_per_100g: 0 },
  { name: 'Vino bianco', kcal_per_100g: 82, protein_per_100g: 0.1, carbs_per_100g: 2.6, fat_per_100g: 0 },
  { name: 'Prosecco', kcal_per_100g: 80, protein_per_100g: 0.2, carbs_per_100g: 2, fat_per_100g: 0 },
  { name: 'Aperol spritz', kcal_per_100g: 110, protein_per_100g: 0, carbs_per_100g: 13, fat_per_100g: 0 },
  { name: 'Coca cola', kcal_per_100g: 42, protein_per_100g: 0, carbs_per_100g: 10.6, fat_per_100g: 0 },
  { name: 'Coca cola zero', kcal_per_100g: 0.4, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0 },
  { name: 'Succo arancia', kcal_per_100g: 45, protein_per_100g: 0.7, carbs_per_100g: 10.4, fat_per_100g: 0.2 },
  { name: 'Acqua', kcal_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0 },

  // Cereali aggiuntivi
  { name: 'Riso basmati cotto', kcal_per_100g: 121, protein_per_100g: 3, carbs_per_100g: 25, fat_per_100g: 0.4 },
  { name: 'Pasta integrale cruda', kcal_per_100g: 348, protein_per_100g: 13, carbs_per_100g: 66, fat_per_100g: 2.5 },
  { name: 'Pasta cruda', kcal_per_100g: 371, protein_per_100g: 13, carbs_per_100g: 75, fat_per_100g: 1.5 },
  { name: 'Riso cotto venere', kcal_per_100g: 122, protein_per_100g: 3.5, carbs_per_100g: 24, fat_per_100g: 1 },
  { name: 'Polenta', kcal_per_100g: 100, protein_per_100g: 2.5, carbs_per_100g: 22, fat_per_100g: 0.5 },
  { name: 'Cracker integrali', kcal_per_100g: 426, protein_per_100g: 11, carbs_per_100g: 64, fat_per_100g: 13 },
  { name: 'Grissini', kcal_per_100g: 433, protein_per_100g: 12, carbs_per_100g: 70, fat_per_100g: 12 },
  { name: 'Fette biscottate', kcal_per_100g: 410, protein_per_100g: 11, carbs_per_100g: 78, fat_per_100g: 7 },
  { name: 'Pane di segale', kcal_per_100g: 259, protein_per_100g: 8.5, carbs_per_100g: 48, fat_per_100g: 3.3 },
  { name: 'Tortillas mais', kcal_per_100g: 218, protein_per_100g: 5.7, carbs_per_100g: 45, fat_per_100g: 2.9 },
  { name: 'Tortillas grano', kcal_per_100g: 304, protein_per_100g: 8, carbs_per_100g: 51, fat_per_100g: 7.5 },
  { name: 'Bagel', kcal_per_100g: 250, protein_per_100g: 10, carbs_per_100g: 49, fat_per_100g: 1.5 },

  // Carni aggiuntive
  { name: 'Hamburger di manzo', kcal_per_100g: 254, protein_per_100g: 17, carbs_per_100g: 0, fat_per_100g: 20 },
  { name: 'Wurstel', kcal_per_100g: 270, protein_per_100g: 13, carbs_per_100g: 2, fat_per_100g: 23 },
  { name: 'Speck', kcal_per_100g: 303, protein_per_100g: 28, carbs_per_100g: 0, fat_per_100g: 20 },
  { name: 'Pancetta', kcal_per_100g: 458, protein_per_100g: 11.7, carbs_per_100g: 0, fat_per_100g: 45 },
  { name: 'Salsiccia', kcal_per_100g: 304, protein_per_100g: 13, carbs_per_100g: 1, fat_per_100g: 27 },
  { name: 'Kebab', kcal_per_100g: 215, protein_per_100g: 16, carbs_per_100g: 5, fat_per_100g: 14 },

  // Pesce aggiuntivo
  { name: 'Sgombro', kcal_per_100g: 205, protein_per_100g: 19, carbs_per_100g: 0, fat_per_100g: 14 },
  { name: 'Sogliola', kcal_per_100g: 86, protein_per_100g: 17, carbs_per_100g: 0.8, fat_per_100g: 1.4 },
  { name: 'Trota', kcal_per_100g: 119, protein_per_100g: 18, carbs_per_100g: 0, fat_per_100g: 4.4 },
  { name: 'Pesce spada', kcal_per_100g: 121, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 4 },
  { name: 'Polpo', kcal_per_100g: 82, protein_per_100g: 14, carbs_per_100g: 1.4, fat_per_100g: 1 },
  { name: 'Cozze', kcal_per_100g: 86, protein_per_100g: 12, carbs_per_100g: 3.7, fat_per_100g: 2.2 },
  { name: 'Vongole', kcal_per_100g: 74, protein_per_100g: 12.7, carbs_per_100g: 2.6, fat_per_100g: 1 },
  { name: 'Bastoncini di pesce', kcal_per_100g: 207, protein_per_100g: 12, carbs_per_100g: 17, fat_per_100g: 10 },

  // Latticini aggiuntivi
  { name: 'Yogurt magro 0%', kcal_per_100g: 42, protein_per_100g: 4.2, carbs_per_100g: 6, fat_per_100g: 0.1 },
  { name: 'Skyr', kcal_per_100g: 63, protein_per_100g: 11, carbs_per_100g: 4, fat_per_100g: 0.2 },
  { name: 'Quark', kcal_per_100g: 73, protein_per_100g: 12, carbs_per_100g: 3.6, fat_per_100g: 0.2 },
  { name: 'Pecorino', kcal_per_100g: 387, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 31 },
  { name: 'Gorgonzola', kcal_per_100g: 330, protein_per_100g: 18, carbs_per_100g: 0, fat_per_100g: 28 },
  { name: 'Brie', kcal_per_100g: 334, protein_per_100g: 21, carbs_per_100g: 0.5, fat_per_100g: 28 },
  { name: 'Provolone', kcal_per_100g: 351, protein_per_100g: 26, carbs_per_100g: 2, fat_per_100g: 27 },
  { name: 'Caprino', kcal_per_100g: 268, protein_per_100g: 18, carbs_per_100g: 1, fat_per_100g: 21 },
  { name: 'Burrata', kcal_per_100g: 290, protein_per_100g: 16, carbs_per_100g: 1, fat_per_100g: 25 },
  { name: 'Latte di mandorla', kcal_per_100g: 25, protein_per_100g: 0.6, carbs_per_100g: 3, fat_per_100g: 1.2 },
  { name: 'Latte di soia', kcal_per_100g: 41, protein_per_100g: 3.3, carbs_per_100g: 2.6, fat_per_100g: 1.8 },
  { name: 'Latte di cocco', kcal_per_100g: 230, protein_per_100g: 2.3, carbs_per_100g: 6, fat_per_100g: 24 },
  { name: 'Panna fresca', kcal_per_100g: 337, protein_per_100g: 2.5, carbs_per_100g: 3, fat_per_100g: 36 },

  // Verdure aggiuntive
  { name: 'Sedano', kcal_per_100g: 16, protein_per_100g: 0.7, carbs_per_100g: 3, fat_per_100g: 0.2 },
  { name: 'Finocchio', kcal_per_100g: 31, protein_per_100g: 1.2, carbs_per_100g: 7, fat_per_100g: 0.2 },
  { name: 'Bietola', kcal_per_100g: 19, protein_per_100g: 1.8, carbs_per_100g: 3.7, fat_per_100g: 0.2 },
  { name: 'Cicoria', kcal_per_100g: 23, protein_per_100g: 1.7, carbs_per_100g: 4.7, fat_per_100g: 0.3 },
  { name: 'Cavoletti di Bruxelles', kcal_per_100g: 43, protein_per_100g: 3.4, carbs_per_100g: 9, fat_per_100g: 0.3 },
  { name: 'Cavolo verza', kcal_per_100g: 25, protein_per_100g: 1.3, carbs_per_100g: 6, fat_per_100g: 0.1 },
  { name: 'Patate dolci', kcal_per_100g: 86, protein_per_100g: 1.6, carbs_per_100g: 20, fat_per_100g: 0.1 },
  { name: 'Mais lessato', kcal_per_100g: 96, protein_per_100g: 3.4, carbs_per_100g: 21, fat_per_100g: 1.5 },
  { name: 'Olive verdi', kcal_per_100g: 145, protein_per_100g: 1, carbs_per_100g: 4, fat_per_100g: 15 },
  { name: 'Olive nere', kcal_per_100g: 235, protein_per_100g: 1.8, carbs_per_100g: 6, fat_per_100g: 25 },
  { name: 'Aglio', kcal_per_100g: 149, protein_per_100g: 6.4, carbs_per_100g: 33, fat_per_100g: 0.5 },

  // Frutta aggiuntiva
  { name: 'Pera', kcal_per_100g: 57, protein_per_100g: 0.4, carbs_per_100g: 15, fat_per_100g: 0.1 },
  { name: 'Anguria', kcal_per_100g: 30, protein_per_100g: 0.6, carbs_per_100g: 7.6, fat_per_100g: 0.2 },
  { name: 'Melone', kcal_per_100g: 34, protein_per_100g: 0.8, carbs_per_100g: 8, fat_per_100g: 0.2 },
  { name: 'Mango', kcal_per_100g: 60, protein_per_100g: 0.8, carbs_per_100g: 15, fat_per_100g: 0.4 },
  { name: 'Albicocche', kcal_per_100g: 48, protein_per_100g: 1.4, carbs_per_100g: 11, fat_per_100g: 0.4 },
  { name: 'Lamponi', kcal_per_100g: 52, protein_per_100g: 1.2, carbs_per_100g: 12, fat_per_100g: 0.7 },
  { name: 'More', kcal_per_100g: 43, protein_per_100g: 1.4, carbs_per_100g: 10, fat_per_100g: 0.5 },
  { name: 'Datteri', kcal_per_100g: 277, protein_per_100g: 1.8, carbs_per_100g: 75, fat_per_100g: 0.2 },
  { name: 'Fichi', kcal_per_100g: 74, protein_per_100g: 0.8, carbs_per_100g: 19, fat_per_100g: 0.3 },
  { name: 'Frutta secca mix', kcal_per_100g: 580, protein_per_100g: 17, carbs_per_100g: 22, fat_per_100g: 50 },

  // Legumi aggiuntivi
  { name: 'Lenticchie rosse cotte', kcal_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.4 },
  { name: 'Hummus', kcal_per_100g: 166, protein_per_100g: 8, carbs_per_100g: 14, fat_per_100g: 10 },
  { name: 'Soia cotta', kcal_per_100g: 173, protein_per_100g: 16, carbs_per_100g: 9, fat_per_100g: 9 },
  { name: 'Seitan', kcal_per_100g: 142, protein_per_100g: 30, carbs_per_100g: 6, fat_per_100g: 0.5 },

  // Frutta secca aggiuntiva
  { name: 'Burro di arachidi', kcal_per_100g: 588, protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50 },
  { name: 'Arachidi', kcal_per_100g: 567, protein_per_100g: 26, carbs_per_100g: 16, fat_per_100g: 49 },
  { name: 'Semi di girasole', kcal_per_100g: 584, protein_per_100g: 21, carbs_per_100g: 20, fat_per_100g: 51 },
  { name: 'Semi di zucca', kcal_per_100g: 559, protein_per_100g: 30, carbs_per_100g: 11, fat_per_100g: 49 },

  // Snack e dolci
  { name: 'Biscotti frollini', kcal_per_100g: 460, protein_per_100g: 6, carbs_per_100g: 70, fat_per_100g: 17 },
  { name: 'Cioccolato fondente 70%', kcal_per_100g: 598, protein_per_100g: 8, carbs_per_100g: 46, fat_per_100g: 43 },
  { name: 'Cioccolato al latte', kcal_per_100g: 535, protein_per_100g: 7.6, carbs_per_100g: 59, fat_per_100g: 30 },
  { name: 'Gelato fior di latte', kcal_per_100g: 207, protein_per_100g: 3.5, carbs_per_100g: 24, fat_per_100g: 11 },
  { name: 'Gelato cioccolato', kcal_per_100g: 216, protein_per_100g: 3.8, carbs_per_100g: 28, fat_per_100g: 11 },
  { name: 'Tiramisu', kcal_per_100g: 240, protein_per_100g: 4.6, carbs_per_100g: 22, fat_per_100g: 14 },
  { name: 'Croissant', kcal_per_100g: 406, protein_per_100g: 8.2, carbs_per_100g: 46, fat_per_100g: 21 },
  { name: 'Cornetto', kcal_per_100g: 380, protein_per_100g: 7.5, carbs_per_100g: 50, fat_per_100g: 17 },
  { name: 'Torta margherita', kcal_per_100g: 345, protein_per_100g: 6, carbs_per_100g: 50, fat_per_100g: 13 },
  { name: 'Crostata marmellata', kcal_per_100g: 360, protein_per_100g: 5, carbs_per_100g: 60, fat_per_100g: 11 },
  { name: 'Patatine fritte busta', kcal_per_100g: 536, protein_per_100g: 6, carbs_per_100g: 53, fat_per_100g: 33 },
  { name: 'Pop corn', kcal_per_100g: 387, protein_per_100g: 12, carbs_per_100g: 78, fat_per_100g: 4.5 },

  // Piatti completi tipici italiani
  { name: 'Pasta al pomodoro', kcal_per_100g: 130, protein_per_100g: 4, carbs_per_100g: 24, fat_per_100g: 2 },
  { name: 'Pasta carbonara', kcal_per_100g: 280, protein_per_100g: 11, carbs_per_100g: 28, fat_per_100g: 13 },
  { name: 'Lasagne', kcal_per_100g: 175, protein_per_100g: 9, carbs_per_100g: 18, fat_per_100g: 7 },
  { name: 'Risotto', kcal_per_100g: 165, protein_per_100g: 4, carbs_per_100g: 25, fat_per_100g: 5 },
  { name: 'Parmigiana melanzane', kcal_per_100g: 200, protein_per_100g: 8, carbs_per_100g: 10, fat_per_100g: 14 },
  { name: 'Cotoletta milanese', kcal_per_100g: 290, protein_per_100g: 22, carbs_per_100g: 12, fat_per_100g: 17 },
  { name: 'Insalata caprese', kcal_per_100g: 165, protein_per_100g: 9, carbs_per_100g: 4, fat_per_100g: 13 },
  { name: 'Bruschetta', kcal_per_100g: 220, protein_per_100g: 6, carbs_per_100g: 32, fat_per_100g: 7 },
  { name: 'Sushi (8 pezzi)', kcal_per_100g: 142, protein_per_100g: 6, carbs_per_100g: 28, fat_per_100g: 0.7 },
  { name: 'Insalata greca', kcal_per_100g: 130, protein_per_100g: 5, carbs_per_100g: 6, fat_per_100g: 10 },
  { name: 'Piadina prosciutto', kcal_per_100g: 280, protein_per_100g: 11, carbs_per_100g: 38, fat_per_100g: 9 },

  // Bevande aggiuntive
  { name: 'Caffe latte', kcal_per_100g: 56, protein_per_100g: 3, carbs_per_100g: 5, fat_per_100g: 2.5 },
  { name: 'Cappuccino', kcal_per_100g: 38, protein_per_100g: 2, carbs_per_100g: 3.5, fat_per_100g: 1.8 },
  { name: 'Camomilla', kcal_per_100g: 1, protein_per_100g: 0, carbs_per_100g: 0.2, fat_per_100g: 0 },
  { name: 'Tisana', kcal_per_100g: 1, protein_per_100g: 0, carbs_per_100g: 0.2, fat_per_100g: 0 },
  { name: 'Aranciata', kcal_per_100g: 41, protein_per_100g: 0.2, carbs_per_100g: 10, fat_per_100g: 0 },
  { name: 'Energy drink', kcal_per_100g: 45, protein_per_100g: 0, carbs_per_100g: 11, fat_per_100g: 0 },
  { name: 'Spremuta arancia', kcal_per_100g: 41, protein_per_100g: 0.7, carbs_per_100g: 9, fat_per_100g: 0.1 },
  { name: 'Smoothie frutta', kcal_per_100g: 60, protein_per_100g: 1, carbs_per_100g: 14, fat_per_100g: 0.3 },
  { name: 'Negroni', kcal_per_100g: 175, protein_per_100g: 0, carbs_per_100g: 8, fat_per_100g: 0 },
  { name: 'Mojito', kcal_per_100g: 110, protein_per_100g: 0, carbs_per_100g: 8, fat_per_100g: 0 },
  { name: 'Gin tonic', kcal_per_100g: 100, protein_per_100g: 0, carbs_per_100g: 5, fat_per_100g: 0 },
  { name: 'Whisky', kcal_per_100g: 250, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0 },

  // Fast food / snack
  { name: 'Pizza salame', kcal_per_100g: 285, protein_per_100g: 12, carbs_per_100g: 31, fat_per_100g: 12 },
  { name: 'Pizza prosciutto e funghi', kcal_per_100g: 250, protein_per_100g: 11, carbs_per_100g: 31, fat_per_100g: 9 },
  { name: 'Hot dog', kcal_per_100g: 247, protein_per_100g: 10, carbs_per_100g: 18, fat_per_100g: 15 },
  { name: 'Patatine McDonald s medie', kcal_per_100g: 312, protein_per_100g: 3.4, carbs_per_100g: 41, fat_per_100g: 15 },
  { name: 'Big Mac', kcal_per_100g: 257, protein_per_100g: 13, carbs_per_100g: 19, fat_per_100g: 14 },
  { name: 'Toast prosciutto e formaggio', kcal_per_100g: 280, protein_per_100g: 12, carbs_per_100g: 30, fat_per_100g: 12 },
  { name: 'Tramezzino tonno', kcal_per_100g: 270, protein_per_100g: 11, carbs_per_100g: 28, fat_per_100g: 13 },

  // Alimenti dietetici / fitness
  { name: 'Proteine in polvere whey', kcal_per_100g: 380, protein_per_100g: 80, carbs_per_100g: 8, fat_per_100g: 5 },
  { name: 'Barretta proteica', kcal_per_100g: 360, protein_per_100g: 30, carbs_per_100g: 35, fat_per_100g: 10 },
  { name: 'Barretta cereali', kcal_per_100g: 400, protein_per_100g: 6, carbs_per_100g: 70, fat_per_100g: 11 },
  { name: 'Maltodestrine', kcal_per_100g: 380, protein_per_100g: 0, carbs_per_100g: 95, fat_per_100g: 0 },
  { name: 'Creatina', kcal_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0 },
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
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([])
  const [showTagModal, setShowTagModal] = useState(false)
  const [customDate, setCustomDate] = useState<string>(() => {
    // default: adesso in formato datetime-local
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes())
  })

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
    // Salva in localStorage come recente (max 10, no duplicati)
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('fytra_recent_ingredients')
        const list: string[] = stored ? JSON.parse(stored) : []
        const filtered = list.filter(n => n !== food.name)
        filtered.unshift(food.name)
        localStorage.setItem('fytra_recent_ingredients', JSON.stringify(filtered.slice(0, 10)))
      }
    } catch {}

    // Check se gia' presente (case-insensitive, trim)
    const normalizedNew = food.name.trim().toLowerCase()
    const existing = ingredients.find(i => i.name.trim().toLowerCase() === normalizedNew)

    if (existing) {
      // Gia' presente: chiedo se l'utente vuole sommare le quantita
      const confirmed = confirm(
        'Hai gia aggiunto "' + food.name + '" (' + existing.grams + 'g). Vuoi aggiungere altri ' + grams + 'g per totale ' + (existing.grams + grams) + 'g?'
      )
      if (confirmed) {
        setIngredients(ingredients.map(i =>
          i.id === existing.id ? { ...i, grams: i.grams + grams } : i
        ))
      }
      setShowAddIngredient(false)
      return
    }

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

    // Valida data: non puo essere nel futuro
    let createdAt: string | undefined
    if (customDate) {
      const picked = new Date(customDate)
      const now = new Date()
      if (picked.getTime() > now.getTime() + 60000) { // 1 min di tolleranza
        onError('La data non puo essere nel futuro.')
        onSaving(false)
        return
      }
      createdAt = picked.toISOString()
    }

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
        ...(createdAt ? { created_at: createdAt } : {}),
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

    // Salva i tag (menzioni per pasti)
    if (taggedUsers.length > 0) {
      const tagRows = taggedUsers.map(tu => ({
        post_id: postData.id,
        user_id: tu.id,
        tagger_id: user!.id,
        tag_type: 'mention' as const,
        status: 'accepted' as const, // Le menzioni sono auto-accettate (no approvazione richiesta)
      }))
      const { error: tagErr } = await supabase.from('post_tags').insert(tagRows)
      if (tagErr) {
        console.error('Errore salvataggio tag:', tagErr)
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
          placeholder="Racconta qualcosa del tuo pasto"
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

      {/* TAG AMICI */}
      <TagFriendsBlock
        taggedUsers={taggedUsers}
        onOpenModal={() => setShowTagModal(true)}
        onRemove={uid => setTaggedUsers(taggedUsers.filter(t => t.id !== uid))}
        tagTypeLabel="con"
      />

      {/* DATA/ORA PERSONALIZZATA */}
      <DateTimePicker value={customDate} onChange={setCustomDate} />

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

      {showTagModal && user && (
        <TagSelectionModal
          currentUserId={user.id}
          alreadyTagged={taggedUsers}
          tagType="mention"
          onClose={() => setShowTagModal(false)}
          onConfirm={users => {
            setTaggedUsers(users)
            setShowTagModal(false)
          }}
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

  // Determine unita' display. Grams is always stored in grams internally.
  // Se grams >= 1000: mostra come kg
  // Default: g
  const unit = ingredient.grams >= 1000 ? 'kg' : 'g'
  const displayValue = unit === 'kg'
    ? (ingredient.grams / 1000).toFixed(ingredient.grams % 100 === 0 ? 1 : 2).replace(/\.?0+$/, '')
    : String(ingredient.grams)

  const handleChange = (raw: string) => {
    // Accetta numeri e punto/virgola
    const clean = raw.replace(/[^0-9.,]/g, '').replace(',', '.')
    const num = parseFloat(clean) || 0
    if (unit === 'kg') {
      onUpdateGrams(Math.round(num * 1000))
    } else {
      onUpdateGrams(Math.round(num))
    }
  }

  const toggleUnit = () => {
    // Switch solo visuale, manteniamo grams
    // Lo forziamo cambiando grams: se sotto 1000 e siamo in g, passa a kg aumentando 1000g (=1kg); viceversa
    // Meglio: cicla g → kg solo se ha senso
    if (unit === 'g' && ingredient.grams >= 100) {
      // Forziamo a kg mostrato come decimale (non cambia il valore stored)
      // non serve fare nulla, basta aggiornare il display toggle
    }
  }

  // Calcolo kcal formattati con K/M se serve
  const kcalDisplay = formatKcalRow(kcal)

  return (
    <div
      style={{
        background: '#F2F2F7',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
        <p style={{ fontSize: '11px', color: '#8E8E93', margin: 0 }}>{kcalDisplay} kcal</p>
      </div>

      {/* Input quantita' + unita' */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={e => {
            // Limito max 5 caratteri (fino a 99999g o 99.9kg)
            if (e.target.value.length > 5) return
            handleChange(e.target.value)
          }}
          style={{
            width: '72px',
            height: '34px',
            padding: '0 8px',
            background: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#000',
            textAlign: 'right',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        <span
          style={{
            fontSize: '11px',
            color: '#8E8E93',
            fontWeight: 600,
            minWidth: '18px',
            textAlign: 'left',
          }}
        >
          {unit}
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
          flexShrink: 0,
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

// Helper: formatta kcal con k/M approssimazioni
function formatKcalRow(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  if (n < 1000000) return Math.round(n / 1000) + 'k'
  return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
}

/* ============ ADD INGREDIENT MODAL ============ */
function AddIngredientModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (food: (typeof FOOD_DB)[0], grams: number) => void
}) {
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<(typeof FOOD_DB)[0] | null>(null)
  const [grams, setGrams] = useState('100')

  // Manuale
  const [manualName, setManualName] = useState('')
  const [manualKcal, setManualKcal] = useState('')
  const [manualProt, setManualProt] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')
  const [manualGrams, setManualGrams] = useState('100')

  // Se c'e' query, mostra risultati filtrati piatti. Se no, raggruppa per categoria.
  const queryLower = query.trim().toLowerCase()
  const filtered = queryLower
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(queryLower)).slice(0, 20)
    : []

  // Ingredienti recenti dal localStorage (max 5)
  const recentIngredients: Array<(typeof FOOD_DB)[0]> = (() => {
    if (typeof window === 'undefined' || queryLower) return []
    try {
      const stored = localStorage.getItem('fytra_recent_ingredients')
      if (!stored) return []
      const names: string[] = JSON.parse(stored)
      return names
        .map(n => FOOD_DB.find(f => f.name === n))
        .filter(Boolean)
        .slice(0, 5) as Array<(typeof FOOD_DB)[0]>
    } catch {
      return []
    }
  })()

  // Raggruppa tutti gli alimenti per categoria
  const grouped: Record<string, Array<(typeof FOOD_DB)[0]>> = {}
  if (!queryLower) {
    FOOD_DB.forEach(f => {
      const cat = getCategory(f.name)
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(f)
    })
  }

  const handleManualSubmit = () => {
    if (!manualName.trim()) return
    const food = {
      name: manualName.trim(),
      kcal_per_100g: parseFloat(manualKcal) || 0,
      protein_per_100g: parseFloat(manualProt) || 0,
      carbs_per_100g: parseFloat(manualCarbs) || 0,
      fat_per_100g: parseFloat(manualFat) || 0,
    }
    const g = parseInt(manualGrams) || 100
    onAdd(food, g)
  }

  const handleAddSelected = () => {
    if (!selected) return
    const g = parseInt(grams.replace(/[^0-9]/g, '')) || 100
    onAdd(selected, g)
  }

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
          maxHeight: '85vh',
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
            onClick={mode === 'search' ? handleAddSelected : handleManualSubmit}
            disabled={mode === 'search' ? !selected : !manualName.trim()}
            style={{
              background: 'none',
              border: 'none',
              color: (mode === 'search' ? !!selected : !!manualName.trim()) ? '#007AFF' : '#C7C7CC',
              fontSize: '15px',
              fontWeight: 600,
              cursor: (mode === 'search' ? !!selected : !!manualName.trim()) ? 'pointer' : 'not-allowed',
              padding: '8px 0',
            }}
          >
            Aggiungi
          </button>
        </div>

        {/* Tab switcher */}
        {!selected && (
          <div style={{ padding: '10px 16px 0' }}>
            <div style={{ background: 'rgba(118,118,128,0.12)', borderRadius: '9px', padding: '2px', display: 'flex' }}>
              <button
                onClick={() => setMode('search')}
                style={{
                  flex: 1,
                  padding: '7px',
                  fontSize: '13px',
                  fontWeight: mode === 'search' ? 600 : 500,
                  color: mode === 'search' ? '#000' : '#3C3C43',
                  background: mode === 'search' ? '#FFF' : 'transparent',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  boxShadow: mode === 'search' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Cerca
              </button>
              <button
                onClick={() => setMode('manual')}
                style={{
                  flex: 1,
                  padding: '7px',
                  fontSize: '13px',
                  fontWeight: mode === 'manual' ? 600 : 500,
                  color: mode === 'manual' ? '#000' : '#3C3C43',
                  background: mode === 'manual' ? '#FFF' : 'transparent',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  boxShadow: mode === 'manual' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Manuale
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 16px' }}>
          {mode === 'search' && !selected && (
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
                  placeholder="Nome dell alimento da cercare"
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
                {/* Se c'e' query: risultati piatti */}
                {queryLower && filtered.map(f => (
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

                {/* Se no query: recenti in alto + raggruppati per categoria */}
                {!queryLower && recentIngredients.length > 0 && (
                  <>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.5px', margin: '6px 4px 2px', textTransform: 'uppercase' }}>
                      Usati di recente
                    </p>
                    {recentIngredients.map(f => (
                      <button
                        key={'recent-' + f.name}
                        onClick={() => setSelected(f)}
                        style={{
                          background: 'rgba(124, 169, 130, 0.08)',
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
                        <span style={{ fontSize: '12px', color: '#4F7057', fontWeight: 600 }}>{f.kcal_per_100g} kcal/100g</span>
                      </button>
                    ))}
                  </>
                )}

                {!queryLower && CATEGORY_ORDER.map(cat => {
                  const items = grouped[cat]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={cat}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.5px', margin: '10px 4px 4px', textTransform: 'uppercase' }}>
                        {cat}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {items.map(f => (
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
                      </div>
                    </div>
                  )
                })}

                {queryLower && filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                    <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0 }}>Nessun alimento trovato.</p>
                    <button
                      onClick={() => {
                        setMode('manual')
                        setManualName(query)
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        background: '#7CA982',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Aggiungi {query ? '"' + query + '"' : ''} manualmente
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'search' && selected && (() => {
            const drinkUnits = getDrinkProfile(selected.name)

            return (
            <div>
              <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>{selected.name}</p>
                <p style={{ fontSize: '12px', color: '#8E8E93', margin: '4px 0 0' }}>
                  {selected.kcal_per_100g} kcal {'\u00B7'} P {selected.protein_per_100g}g {'\u00B7'} C {selected.carbs_per_100g}g {'\u00B7'} F {selected.fat_per_100g}g (per 100{drinkUnits ? 'ml' : 'g'})
                </p>
              </div>

              {drinkUnits ? (
                /* === BEVANDE: unita domestiche === */
                <>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Quanto ne hai bevuto?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    {drinkUnits.map(u => {
                      const totalMl = u.ml
                      const isActive = parseInt(grams) === totalMl
                      return (
                        <button
                          key={u.label}
                          onClick={() => setGrams(String(totalMl))}
                          style={{
                            background: isActive ? 'rgba(124, 169, 130, 0.15)' : '#FFF',
                            border: isActive ? '1.5px solid #7CA982' : '1.5px solid transparent',
                            borderRadius: '12px',
                            padding: '14px 10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>{u.emoji}</span>
                          <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 600, color: isActive ? '#4F7057' : '#000' }}>
                            {u.label}
                          </span>
                          <span style={{ fontSize: '11px', color: '#8E8E93' }}>
                            {u.ml} ml
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Possibilita' di mettere quantita' personalizzata */}
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    O quantit{'\u00E0'} personalizzata
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={grams}
                      onChange={e => setGrams(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 44px 0 14px',
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
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8E8E93', pointerEvents: 'none' }}>
                      ml
                    </span>
                  </div>
                </>
              ) : (
                /* === SOLIDI: grammi normali === */
                <>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Quantit{'\u00E0'} (grammi)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={grams}
                      onChange={e => setGrams(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      autoFocus
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 44px 0 14px',
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
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#8E8E93', pointerEvents: 'none' }}>
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
                </>
              )}

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
            )
          })()}

          {mode === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ManualField label="Nome alimento" required value={manualName} onChange={setManualName} placeholder="Nome del tuo ingrediente" />
              <ManualField label="Kcal per 100g" value={manualKcal} onChange={setManualKcal} numeric placeholder="Calorie per 100g (opzionale)" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <ManualField label="Proteine" value={manualProt} onChange={setManualProt} numeric small placeholder="g" />
                <ManualField label="Carboidrati" value={manualCarbs} onChange={setManualCarbs} numeric small placeholder="g" />
                <ManualField label="Grassi" value={manualFat} onChange={setManualFat} numeric small placeholder="g" />
              </div>
              <ManualField label="Quantit\u00E0 (grammi)" value={manualGrams} onChange={setManualGrams} numeric placeholder="Quantita in grammi" />
              <p style={{ fontSize: '11px', color: '#8E8E93', margin: 0, lineHeight: 1.4 }}>
                I valori nutrizionali sono facoltativi. Se li lasci vuoti, l AI stimer{'\u00E0'} i valori in un secondo momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ManualField({
  label, value, onChange, placeholder, numeric, required, small,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  numeric?: boolean
  required?: boolean
  small?: boolean
}) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', letterSpacing: '0.3px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
        {label}{required && <span style={{ color: '#FF3B30' }}> *</span>}
      </label>
      <input
        type="text"
        inputMode={numeric ? 'decimal' : 'text'}
        value={value}
        onChange={e => onChange(numeric ? e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.') : e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: small ? '36px' : '40px',
          padding: '0 12px',
          background: '#FFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#000',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
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
  const [customTypeName, setCustomTypeName] = useState('')
  const [showMoreTypes, setShowMoreTypes] = useState(false)
  const [durationMin, setDurationMin] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [heartrate, setHeartrate] = useState('')
  const [notes, setNotes] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([])
  const [showTagModal, setShowTagModal] = useState(false)
  const [customDate, setCustomDate] = useState<string>(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes())
  })

  // Auto-calcolo velocita media
  const speedKmh =
    durationMin && distanceKm && parseFloat(durationMin) > 0
      ? (parseFloat(distanceKm) / (parseFloat(durationMin) / 60)).toFixed(1)
      : ''

  // Top 8 sport piu praticati in Italia + Altro
  const primaryTypes: { v: WorkoutType; l: string; icon: React.ReactNode }[] = [
    { v: 'corsa', l: 'Corsa', icon: <IconRun /> },
    { v: 'bici', l: 'Bici', icon: <IconBike /> },
    { v: 'palestra', l: 'Palestra', icon: <IconGym /> },
    { v: 'camminata', l: 'Camminata', icon: <IconWalk /> },
    { v: 'nuoto', l: 'Nuoto', icon: <IconSwim /> },
    { v: 'calcio', l: 'Calcio', icon: <IconRun /> },
    { v: 'yoga', l: 'Yoga', icon: <IconYoga /> },
    { v: 'altro', l: 'Altro', icon: <IconDots /> },
  ]

  // Sport secondari, espandibili
  const secondaryTypes: { v: WorkoutType; l: string }[] = [
    { v: 'tennis', l: 'Tennis' },
    { v: 'padel', l: 'Padel' },
    { v: 'basket', l: 'Basket' },
    { v: 'pallavolo', l: 'Pallavolo' },
    { v: 'hiit', l: 'HIIT' },
    { v: 'pilates', l: 'Pilates' },
    { v: 'crossfit', l: 'Crossfit' },
    { v: 'boxe', l: 'Boxe' },
    { v: 'arti_marziali', l: 'Arti marziali' },
    { v: 'sci', l: 'Sci' },
    { v: 'snowboard', l: 'Snowboard' },
    { v: 'surf', l: 'Surf' },
    { v: 'arrampicata', l: 'Arrampicata' },
    { v: 'rugby', l: 'Rugby' },
    { v: 'danza', l: 'Danza' },
    { v: 'escursionismo', l: 'Escursionismo' },
  ]

  const workoutTypes = primaryTypes

  const handleSubmit = async () => {
    if (!user) return
    if (!durationMin) {
      onError('Inserisci almeno la durata.')
      return
    }
    if (workoutType === 'altro' && !customTypeName.trim()) {
      onError('Specifica il tipo di allenamento.')
      return
    }
    onSaving(true)
    onError('')

    // Data custom
    let createdAt: string | undefined
    if (customDate) {
      const picked = new Date(customDate)
      const now = new Date()
      if (picked.getTime() > now.getTime() + 60000) {
        onError('La data non puo essere nel futuro.')
        onSaving(false)
        return
      }
      createdAt = picked.toISOString()
    }

    // Nome tipo allenamento
    const resolvedTypeName = workoutType === 'altro'
      ? customTypeName.trim()
      : (primaryTypes.find(w => w.v === workoutType)?.l
          || secondaryTypes.find(w => w.v === workoutType)?.l
          || workoutType)

    const { data: postData, error: insertError } = await supabase.from('posts').insert({
      user_id: user!.id,
      type: 'allenamento',
      is_private: isPrivate,
      workout_type: resolvedTypeName,
      workout_duration_min: parseInt(durationMin) || null,
      workout_distance_km: distanceKm ? parseFloat(distanceKm) : null,
      workout_speed_kmh: speedKmh ? parseFloat(speedKmh) : null,
      workout_heartrate: heartrate ? parseInt(heartrate) : null,
      workout_notes: notes || null,
      ...(createdAt ? { created_at: createdAt } : {}),
    }).select('id').single()

    if (insertError) {
      onError('Errore salvataggio: ' + insertError.message)
      onSaving(false)
    } else {
      // Salva tag (Round 3a: tutti come 'pending' per coworkout, status conferma in 3b)
      if (taggedUsers.length > 0 && postData) {
        const tagRows = taggedUsers.map(tu => ({
          post_id: postData.id,
          user_id: tu.id,
          tagger_id: user!.id,
          tag_type: tu.tag_type,
          status: tu.tag_type === 'mention' ? 'accepted' : 'pending',
        }))
        const { error: tagErr } = await supabase.from('post_tags').insert(tagRows)
        if (tagErr) {
          console.error('Errore salvataggio tag:', tagErr)
        }
      }
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
              {primaryTypes.map(t => {
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

            {/* Se selezionato un sport secondario, mostralo come chip attivo */}
            {!primaryTypes.find(t => t.v === workoutType) && workoutType !== 'altro' && (
              <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(124, 169, 130, 0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F7057' }}>
                  {secondaryTypes.find(t => t.v === workoutType)?.l}
                </span>
                <button onClick={() => setWorkoutType('corsa')} style={{ background: 'none', border: 'none', color: '#4F7057', fontSize: '11px', cursor: 'pointer' }}>
                  Cambia
                </button>
              </div>
            )}

            {/* Free text se selezionato Altro */}
            {workoutType === 'altro' && (
              <input
                type="text"
                value={customTypeName}
                onChange={e => setCustomTypeName(e.target.value.slice(0, 40))}
                placeholder="Scrivi il tipo di allenamento"
                style={{
                  width: '100%',
                  marginTop: '10px',
                  height: '40px',
                  padding: '0 12px',
                  background: '#F2F2F7',
                  border: '1.5px solid #7CA982',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#000',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {/* Toggle altri sport */}
            <button
              onClick={() => setShowMoreTypes(!showMoreTypes)}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#007AFF',
                fontWeight: 500,
              }}
            >
              {showMoreTypes ? 'Nascondi altri sport' : '+ Altri sport'}
            </button>

            {showMoreTypes && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                {secondaryTypes.map(t => {
                  const active = workoutType === t.v
                  return (
                    <button
                      key={t.v}
                      onClick={() => setWorkoutType(t.v)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        background: active ? 'rgba(124, 169, 130, 0.15)' : '#F2F2F7',
                        border: active ? '1.5px solid #7CA982' : '1.5px solid transparent',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: active ? 700 : 500,
                        color: active ? '#4F7057' : '#3C3C43',
                      }}
                    >
                      {t.l}
                    </button>
                  )
                })}
              </div>
            )}
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
              placeholder="Aggiungi note sull allenamento (facoltativo)"
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

          {/* TAG AMICI (CO-ALLENAMENTO O MENZIONE) */}
          <TagFriendsBlock
            taggedUsers={taggedUsers}
            onOpenModal={() => setShowTagModal(true)}
            onRemove={uid => setTaggedUsers(taggedUsers.filter(t => t.id !== uid))}
            tagTypeLabel="Allenati con"
            allowCoworkout
          />

          {/* DATA/ORA PERSONALIZZATA */}
          <DateTimePicker value={customDate} onChange={setCustomDate} />

          <PrivacyToggle isPrivate={isPrivate} onChange={setIsPrivate} />

          {error && <ErrorBanner text={error} />}

          <button onClick={handleSubmit} disabled={saving} style={submitBtnStyle(saving)}>
            {saving ? 'Pubblicazione...' : 'Pubblica allenamento'}
          </button>
        </>
      )}

      {showTagModal && user && (
        <TagSelectionModal
          currentUserId={user.id}
          alreadyTagged={taggedUsers}
          tagType="coworkout"
          onClose={() => setShowTagModal(false)}
          onConfirm={users => {
            setTaggedUsers(users)
            setShowTagModal(false)
          }}
        />
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

function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Max = adesso (non permettere date future)
  const maxDate = (() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes())
  })()

  const isToday = (() => {
    const d = new Date(value)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })()

  return (
    <div
      style={{
        background: '#FFF',
        borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>Data e ora</p>
          <p style={{ fontSize: '11px', color: '#8E8E93', margin: '2px 0 0' }}>
            {isToday ? 'Adesso' : 'Retroattivo'}
          </p>
        </div>
        <input
          type="datetime-local"
          value={value}
          max={maxDate}
          onChange={e => onChange(e.target.value)}
          style={{
            background: '#F2F2F7',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '13px',
            fontFamily: 'inherit',
            color: '#000',
            outline: 'none',
          }}
        />
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

/* ============ TAG FRIENDS BLOCK (selezione utenti taggati nel post) ============ */
function TagFriendsBlock({
  taggedUsers,
  onOpenModal,
  onRemove,
  tagTypeLabel,
  allowCoworkout,
}: {
  taggedUsers: TaggedUser[]
  onOpenModal: () => void
  onRemove: (uid: string) => void
  tagTypeLabel: string
  allowCoworkout?: boolean
}) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: taggedUsers.length > 0 ? '10px' : 0 }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>Tagga amici</p>
          <p style={{ fontSize: '11px', color: '#8E8E93', margin: '2px 0 0' }}>
            {allowCoworkout ? 'Allena con' : 'Menziona'} altri utenti nel post
          </p>
        </div>
        <button
          onClick={onOpenModal}
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            background: '#7CA982',
            color: '#FFF',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {taggedUsers.length > 0 ? 'Modifica' : '+ Aggiungi'}
        </button>
      </div>

      {taggedUsers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {taggedUsers.map(tu => (
            <div
              key={tu.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                background: tu.tag_type === 'coworkout' ? 'rgba(124, 169, 130, 0.15)' : '#F2F2F7',
                borderRadius: '14px',
                border: tu.tag_type === 'coworkout' ? '1px solid rgba(124, 169, 130, 0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: tu.tag_type === 'coworkout' ? '#4F7057' : '#000' }}>
                @{tu.username || 'utente'}
              </span>
              {tu.tag_type === 'coworkout' && (
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#4F7057', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  COND.
                </span>
              )}
              <button
                onClick={() => onRemove(tu.id)}
                aria-label="Rimuovi tag"
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3C3C43',
                  padding: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ TAG SELECTION MODAL (cerca e tagga utenti) ============ */
function TagSelectionModal({
  currentUserId,
  alreadyTagged,
  tagType,
  onClose,
  onConfirm,
}: {
  currentUserId: string
  alreadyTagged: TaggedUser[]
  tagType: 'mention' | 'coworkout'
  onClose: () => void
  onConfirm: (users: TaggedUser[]) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TaggedUser[]>([])
  const [selected, setSelected] = useState<TaggedUser[]>(alreadyTagged)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Carica suggeriti (i miei seguiti) all'apertura
  useEffect(() => {
    loadSuggested()
  }, [])

  const loadSuggested = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('follows')
      .select('profiles!follows_following_profiles_fkey(id, username, full_name, avatar_url)')
      .eq('follower_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      const profiles = data
        .map((r: any) => r.profiles)
        .filter(Boolean)
        .filter((p: any) => p.id !== currentUserId)
        .map((p: any) => ({ ...p, tag_type: tagType }))
      setResults(profiles as TaggedUser[])
    }
    setLoading(false)
  }

  // Cerca utenti per nome/username
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      if (!hasSearched) loadSuggested()
      return
    }
    setHasSearched(true)
    setLoading(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or('username.ilike.%' + q + '%,full_name.ilike.%' + q + '%')
        .neq('id', currentUserId)
        .limit(20)

      if (data) {
        setResults(
          data.map((p: any) => ({ ...p, tag_type: tagType })) as TaggedUser[]
        )
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(t)
  }, [query, tagType, currentUserId])

  const isSelected = (id: string) => selected.some(s => s.id === id)

  const toggle = (u: TaggedUser) => {
    if (isSelected(u.id)) {
      setSelected(selected.filter(s => s.id !== u.id))
    } else {
      setSelected([...selected, u])
    }
  }

  const toggleType = (id: string) => {
    setSelected(selected.map(s => s.id === id ? { ...s, tag_type: s.tag_type === 'coworkout' ? 'mention' : 'coworkout' } : s))
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
          height: '85vh',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          }}
        >
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '15px', cursor: 'pointer', padding: '8px 0' }}>
            Annulla
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Tagga amici</h3>
          <button
            onClick={() => onConfirm(selected)}
            style={{
              background: 'none',
              border: 'none',
              color: '#007AFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 0',
            }}
          >
            Fatto
          </button>
        </div>

        <div style={{ padding: '12px 16px 0' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca per nome o username"
            autoFocus
            style={{
              width: '100%',
              height: '40px',
              padding: '0 12px',
              background: '#FFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {selected.length > 0 && (
          <div style={{ padding: '10px 16px 4px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.3px', margin: '0 0 6px', textTransform: 'uppercase' }}>
              Selezionati ({selected.length})
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {selected.map(s => (
                <button
                  key={'sel-' + s.id}
                  onClick={() => tagType === 'coworkout' && toggleType(s.id)}
                  style={{
                    padding: '4px 8px',
                    background: s.tag_type === 'coworkout' ? 'rgba(124, 169, 130, 0.2)' : '#FFF',
                    border: s.tag_type === 'coworkout' ? '1px solid rgba(124, 169, 130, 0.4)' : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: s.tag_type === 'coworkout' ? '#4F7057' : '#000',
                    cursor: tagType === 'coworkout' ? 'pointer' : 'default',
                  }}
                >
                  @{s.username || 'utente'}
                  {s.tag_type === 'coworkout' && ' \u2713 cond.'}
                </button>
              ))}
            </div>
            {tagType === 'coworkout' && (
              <p style={{ fontSize: '10px', color: '#8E8E93', margin: '6px 0 0', lineHeight: 1.3 }}>
                Tap su un utente per cambiare tipo: condiviso (allenamento appare anche sul suo profilo dopo conferma) o solo menzione.
              </p>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {!query && results.length > 0 && (
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', letterSpacing: '0.3px', margin: '8px 16px 4px', textTransform: 'uppercase' }}>
              Suggeriti
            </p>
          )}

          {loading && (
            <p style={{ textAlign: 'center', padding: '20px', color: '#8E8E93', fontSize: '13px' }}>Caricamento...</p>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p style={{ textAlign: 'center', padding: '20px', color: '#8E8E93', fontSize: '13px' }}>
              Nessun utente trovato.
            </p>
          )}

          {!loading && results.map(u => {
            const sel = isSelected(u.id)
            const username = u.username || 'utente'
            return (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: sel ? 'rgba(124, 169, 130, 0.08)' : 'transparent',
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
                    background: u.avatar_url ? 'transparent' : '#7CA982',
                    color: '#FFF',
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
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: sel ? '#7CA982' : 'transparent',
                    border: sel ? 'none' : '1.5px solid #C7C7CC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {sel && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
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
