"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    age: '',
    sex: '',
    weight_kg: '',
    height_cm: '',
    activity_level: '',
    job_type: '',
    goal: '',
    workout_frequency: '',
    sleep_hours: '',
    diet_preference: '',
    allergies: '',
    motivation: '',
    daily_water_goal_liters: '2.5',
  })

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const totalSteps = 5
  const progress = step === 0 ? 0 : step === 6 ? 100 : (step / totalSteps) * 100

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    const profileData = {
      id: user.id,
      username: form.username,
      full_name: form.full_name,
      age: parseInt(form.age) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
      height_cm: parseFloat(form.height_cm) || null,
      activity_level: form.activity_level || null,
      goal: form.goal || null,
      workout_frequency: parseInt(form.workout_frequency) || 0,
      daily_water_goal_liters: parseFloat(form.daily_water_goal_liters) || 2.5,
      bio: [
        form.sex ? 'Sesso: ' + form.sex : '',
        form.job_type ? 'Lavoro: ' + form.job_type : '',
        form.diet_preference ? 'Dieta: ' + form.diet_preference : '',
        form.allergies ? 'Allergie: ' + form.allergies : '',
        form.sleep_hours ? 'Sonno: ' + form.sleep_hours : '',
        form.motivation ? 'Motivazione: ' + form.motivation : '',
      ]
        .filter(Boolean)
        .join(' | '),
    }

    const { error: insertError } = await supabase.from('profiles').insert(profileData)

    if (insertError) {
      if (insertError.code === '23505') {
        const { error: updateError } = await supabase.from('profiles').update(profileData).eq('id', user.id)
        if (updateError) {
          setError('Errore salvataggio: ' + updateError.message)
          setLoading(false)
          return
        }
      } else {
        setError('Errore: ' + insertError.message)
        setLoading(false)
        return
      }
    }

    router.push('/feed')
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* PROGRESS HEADER (only on steps 1-5) */}
        {step > 0 && step < 6 && (
          <header
            style={{
              background: 'rgba(242, 242, 247, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '14px 20px 12px',
              position: 'sticky',
              top: 0,
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={() => setStep((step - 1) as Step)}
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
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', margin: 0, letterSpacing: '0.5px' }}>
                  PASSO {step} DI {totalSteps}
                </p>
              </div>
              <button
                onClick={() => setStep(6)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#8E8E93',
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Salta
              </button>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: '5px',
                background: 'rgba(0,0,0,0.06)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: progress + '%',
                  background: '#7CA982',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </header>
        )}

        {/* CONTENT */}
        <main
          style={{
            flex: 1,
            padding: step === 0 || step === 6 ? '0' : '20px 20px 100px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* STEP 0 — WELCOME */}
          {step === 0 && <StepWelcome onStart={() => setStep(1)} />}

          {/* STEP 1 — IDENTITA' */}
          {step === 1 && (
            <StepContent
              title="Come ti chiamiamo?"
              subtitle="Questi dati appaiono nel tuo profilo e nel feed."
            >
              <LabeledInput
                label="Username"
                value={form.username}
                onChange={v => update('username', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="marco_fit"
                hint="Solo lettere, numeri e _ (minuscolo)"
              />
              <LabeledInput
                label="Nome completo"
                value={form.full_name}
                onChange={v => update('full_name', v)}
                placeholder="Marco Rossi"
              />
              <LabeledInput
                label={'Et' + '\u00E0'}
                value={form.age}
                onChange={v => update('age', v.replace(/\D/g, '').slice(0, 3))}
                placeholder="27"
                inputMode="numeric"
                suffix="anni"
              />

              <PrimaryButton
                disabled={!form.username || !form.full_name || !form.age}
                onClick={() => setStep(2)}
              >
                Avanti
              </PrimaryButton>
            </StepContent>
          )}

          {/* STEP 2 — CORPO */}
          {step === 2 && (
            <StepContent
              title="Parlaci del tuo corpo"
              subtitle="Ci servono per calcolare fabbisogni e consigli. Restano privati."
            >
              <div>
                <label style={labelStyle}>Sesso biologico</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <SelectCard
                    active={form.sex === 'M'}
                    onClick={() => update('sex', 'M')}
                    label="Uomo"
                    icon={
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="14" r="5" />
                        <line x1="19" y1="5" x2="13.6" y2="10.4" />
                        <polyline points="19 5 15 5 19 5 19 9" />
                      </svg>
                    }
                  />
                  <SelectCard
                    active={form.sex === 'F'}
                    onClick={() => update('sex', 'F')}
                    label="Donna"
                    icon={
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="9" r="5" />
                        <line x1="12" y1="14" x2="12" y2="22" />
                        <line x1="9" y1="19" x2="15" y2="19" />
                      </svg>
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <LabeledInput
                  label="Peso"
                  value={form.weight_kg}
                  onChange={v => update('weight_kg', v)}
                  placeholder="84"
                  inputMode="decimal"
                  suffix="kg"
                />
                <LabeledInput
                  label="Altezza"
                  value={form.height_cm}
                  onChange={v => update('height_cm', v.replace(/\D/g, '').slice(0, 3))}
                  placeholder="178"
                  inputMode="numeric"
                  suffix="cm"
                />
              </div>

              <div>
                <label style={labelStyle}>Ore di sonno tipiche</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { v: 'meno_5', l: '<5h' },
                    { v: '5-6', l: '5-6h' },
                    { v: '6-7', l: '6-7h' },
                    { v: '7-8', l: '7-8h' },
                    { v: '8-9', l: '8-9h' },
                    { v: 'piu_9', l: '>9h' },
                  ].map(opt => (
                    <MiniPillCard
                      key={opt.v}
                      active={form.sleep_hours === opt.v}
                      onClick={() => update('sleep_hours', opt.v)}
                      label={opt.l}
                    />
                  ))}
                </div>
              </div>

              <PrimaryButton
                disabled={!form.sex || !form.weight_kg || !form.height_cm}
                onClick={() => setStep(3)}
              >
                Avanti
              </PrimaryButton>
            </StepContent>
          )}

          {/* STEP 3 — STILE DI VITA */}
          {step === 3 && (
            <StepContent
              title="Il tuo stile di vita"
              subtitle="Quanto ti muovi nella giornata oltre lo sport."
            >
              <div>
                <label style={labelStyle}>Che lavoro fai?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { v: 'ufficio_sedentario', l: 'Ufficio sedentario', s: '8h alla scrivania' },
                    { v: 'ufficio_misto', l: 'Misto', s: 'Un po seduto un po in piedi' },
                    { v: 'in_piedi', l: 'In piedi', s: 'Negozio, bar, cucina' },
                    { v: 'fisico_leggero', l: 'Fisico leggero', s: 'Magazzino, consegne' },
                    { v: 'fisico_pesante', l: 'Fisico pesante', s: 'Cantiere, agricoltura' },
                    { v: 'studente', l: 'Studente', s: 'Universit' + '\u00E0' + ' o scuola' },
                    { v: 'altro', l: 'Altro', s: '' },
                  ].map(opt => (
                    <ChoiceRow
                      key={opt.v}
                      active={form.job_type === opt.v}
                      onClick={() => update('job_type', opt.v)}
                      label={opt.l}
                      subtitle={opt.s}
                    />
                  ))}
                </div>
              </div>

              <PrimaryButton disabled={!form.job_type} onClick={() => setStep(4)}>
                Avanti
              </PrimaryButton>
            </StepContent>
          )}

          {/* STEP 4 — ATTIVITA E OBIETTIVO */}
          {step === 4 && (
            <StepContent
              title={'Qual\u2019' + 'e' + '\u0300' + ' il tuo obiettivo?'}
              subtitle="L AI personalizzera i consigli in base a questo."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {[
                  {
                    v: 'asciugarsi',
                    l: 'Perdere grasso',
                    s: 'Definizione, asciugatura',
                    emoji: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D17A3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                    ),
                  },
                  {
                    v: 'massa',
                    l: 'Massa muscolare',
                    s: 'Costruire muscoli',
                    emoji: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7CA982" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 18 7.5 11.5 12.5 16.5 23 6" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                    ),
                  },
                  {
                    v: 'mantenimento',
                    l: 'Mantenimento',
                    s: 'Rimanere in forma',
                    emoji: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    ),
                  },
                  {
                    v: 'salute',
                    l: 'Salute generale',
                    s: 'Benessere a lungo termine',
                    emoji: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    ),
                  },
                ].map(opt => (
                  <GoalCard
                    key={opt.v}
                    active={form.goal === opt.v}
                    onClick={() => update('goal', opt.v)}
                    label={opt.l}
                    subtitle={opt.s}
                    icon={opt.emoji}
                  />
                ))}
              </div>

              <div>
                <label style={labelStyle}>Livello di attivit{'\u00E0'} sportiva</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { v: 'sedentario', l: 'Sedentario', s: 'Nessun esercizio' },
                    { v: 'leggero', l: 'Leggero', s: '1-2 volte a settimana' },
                    { v: 'moderato', l: 'Moderato', s: '2-3 volte' },
                    { v: 'attivo', l: 'Attivo', s: '4-5 volte' },
                    { v: 'molto_attivo', l: 'Molto attivo', s: '6-7 volte intensi' },
                  ].map(opt => (
                    <ChoiceRow
                      key={opt.v}
                      active={form.activity_level === opt.v}
                      onClick={() => update('activity_level', opt.v)}
                      label={opt.l}
                      subtitle={opt.s}
                    />
                  ))}
                </div>
              </div>

              <PrimaryButton disabled={!form.goal || !form.activity_level} onClick={() => setStep(5)}>
                Avanti
              </PrimaryButton>
            </StepContent>
          )}

          {/* STEP 5 — ALIMENTAZIONE E MOTIVAZIONE */}
          {step === 5 && (
            <StepContent title="Ultimo passo" subtitle="Alimentazione e cosa ti spinge a migliorarti.">
              <div>
                <label style={labelStyle}>Dieta che segui</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { v: 'onnivoro', l: 'Mangio tutto' },
                    { v: 'mediterranea', l: 'Mediterranea' },
                    { v: 'vegetariano', l: 'Vegetariano' },
                    { v: 'vegano', l: 'Vegano' },
                    { v: 'pescetariano', l: 'Pescetariano' },
                    { v: 'keto', l: 'Keto / low carb' },
                    { v: 'senza_glutine', l: 'Senza glutine' },
                    { v: 'senza_lattosio', l: 'Senza lattosio' },
                  ].map(opt => (
                    <MiniPillCard
                      key={opt.v}
                      active={form.diet_preference === opt.v}
                      onClick={() => update('diet_preference', opt.v)}
                      label={opt.l}
                    />
                  ))}
                </div>
              </div>

              <LabeledInput
                label="Allergie o intolleranze"
                value={form.allergies}
                onChange={v => update('allergies', v)}
                placeholder="es. lattosio, frutta secca, nessuna"
                optional
              />

              <div>
                <label style={labelStyle}>Cosa ti motiva di pi{'\u00F9'}?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { v: 'estetica', l: 'Vedermi meglio allo specchio' },
                    { v: 'salute', l: 'Stare in salute a lungo termine' },
                    { v: 'performance', l: 'Migliorare le performance' },
                    { v: 'energia', l: 'Avere pi' + '\u00F9' + ' energia' },
                    { v: 'mentale', l: 'Benefici mentali (umore, stress)' },
                    { v: 'sociale', l: 'Fare attivit' + '\u00E0' + ' con amici' },
                  ].map(opt => (
                    <ChoiceRow
                      key={opt.v}
                      active={form.motivation === opt.v}
                      onClick={() => update('motivation', opt.v)}
                      label={opt.l}
                      subtitle=""
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(255, 59, 48, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#C53030',
                  }}
                >
                  {error}
                </div>
              )}

              <PrimaryButton disabled={loading} onClick={() => setStep(6)}>
                Vedi riepilogo
              </PrimaryButton>
            </StepContent>
          )}

          {/* STEP 6 — RIEPILOGO FINALE */}
          {step === 6 && (
            <StepSummary
              form={form}
              loading={loading}
              onConfirm={handleSubmit}
              onBack={() => setStep(5)}
              error={error}
            />
          )}
        </main>
      </div>
    </div>
  )
}

/* ============== SUB-COMPONENTS ============== */

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#8E8E93',
  letterSpacing: '0.3px',
  textTransform: 'uppercase',
  marginBottom: '8px',
}

function StepWelcome({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '24px',
          background: '#7CA982',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124, 169, 130, 0.35)',
          marginBottom: '28px',
        }}
      >
        <svg width="56" height="56" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 220 140 Q 220 120 240 120 L 400 120 Q 420 120 420 140 Q 420 160 400 160 L 260 160 L 260 250 L 370 250 Q 390 250 390 270 Q 390 290 370 290 L 260 290 L 260 460 Q 260 480 240 480 Q 220 480 220 460 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 295 205 Q 345 205 345 250 Q 345 275 320 275"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>

      <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
        Benvenuto in Fytra
      </h1>
      <p style={{ fontSize: '16px', color: '#3C3C43', margin: '14px 0 32px', lineHeight: 1.5, maxWidth: '300px' }}>
        Ti faremo 5 domande rapide per personalizzare il tuo AI Coach. Bastano 2 minuti.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', width: '100%' }}>
        <BenefitRow
          color="#7CA982"
          title="Consigli su misura"
          text="Basati su obiettivi, pasti e allenamenti."
        />
        <BenefitRow
          color="#D17A3C"
          title="Privacy totale"
          text="I tuoi dati restano tuoi. Sempre."
        />
        <BenefitRow
          color="#3B82F6"
          title="Community fitness"
          text="Scopri cosa fanno persone come te."
        />
      </div>

      <button
        onClick={onStart}
        style={{
          width: '100%',
          height: '52px',
          background: '#7CA982',
          color: '#FFF',
          border: 'none',
          borderRadius: '14px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(124, 169, 130, 0.35)',
        }}
      >
        Iniziamo
      </button>
    </div>
  )
}

function BenefitRow({ color, title, text }: { color: string; title: string; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        background: '#FFF',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <div style={{ textAlign: 'left', flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>{text}</p>
      </div>
    </div>
  )
}

function StepContent({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: '#8E8E93', margin: '6px 0 0', lineHeight: 1.4 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  suffix,
  hint,
  optional,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
  suffix?: string
  hint?: string
  optional?: boolean
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {optional && (
          <span style={{ color: '#C7C7CC', fontWeight: 500, textTransform: 'none', marginLeft: '6px', letterSpacing: 0 }}>
            facoltativo
          </span>
        )}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode={inputMode || 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '48px',
            padding: suffix ? '0 50px 0 14px' : '0 14px',
            background: '#FFF',
            border: '1.5px solid transparent',
            borderRadius: '12px',
            fontSize: '15px',
            color: '#000',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#7CA982')}
          onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
        />
        {suffix && (
          <span
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: '#8E8E93',
              fontWeight: 500,
              pointerEvents: 'none',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p style={{ fontSize: '11px', color: '#8E8E93', margin: '4px 2px 0', lineHeight: 1.3 }}>{hint}</p>
      )}
    </div>
  )
}

function SelectCard({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(124, 169, 130, 0.12)' : '#FFF',
        border: active ? '1.5px solid #7CA982' : '1.5px solid transparent',
        borderRadius: '14px',
        padding: '18px 10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: active ? '#4F7057' : '#3C3C43',
        boxShadow: active ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      <span style={{ fontSize: '15px', fontWeight: 600 }}>{label}</span>
    </button>
  )
}

function MiniPillCard({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#7CA982' : '#FFF',
        border: 'none',
        borderRadius: '10px',
        padding: '10px 8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: active ? 700 : 500,
        color: active ? '#FFF' : '#3C3C43',
        boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function ChoiceRow({
  active,
  onClick,
  label,
  subtitle,
}: {
  active: boolean
  onClick: () => void
  label: string
  subtitle: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(124, 169, 130, 0.1)' : '#FFF',
        border: active ? '1.5px solid #7CA982' : '1.5px solid transparent',
        borderRadius: '12px',
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        textAlign: 'left',
        boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: active ? '#4F7057' : '#000', margin: 0 }}>
          {label}
        </p>
        {subtitle && (
          <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>{subtitle}</p>
        )}
      </div>
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: active ? '#7CA982' : 'transparent',
          border: active ? 'none' : '2px solid #C7C7CC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {active && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  )
}

function GoalCard({
  active,
  onClick,
  label,
  subtitle,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(124, 169, 130, 0.12)' : '#FFF',
        border: active ? '1.5px solid #7CA982' : '1.5px solid transparent',
        borderRadius: '14px',
        padding: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        textAlign: 'left',
        boxShadow: active ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: '#F2F2F7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: active ? '#4F7057' : '#000', margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>{subtitle}</p>
      </div>
      {active && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#7CA982" stroke="none">
          <circle cx="12" cy="12" r="10" />
          <polyline points="16 10 11 15 8 12" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: '52px',
        background: disabled ? '#C7C7CC' : '#7CA982',
        color: '#FFF',
        border: 'none',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(124, 169, 130, 0.3)',
        marginTop: '8px',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function StepSummary({
  form,
  loading,
  onConfirm,
  onBack,
  error,
}: {
  form: Record<string, string>
  loading: boolean
  onConfirm: () => void
  onBack: () => void
  error: string
}) {
  const pretty = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const rows = [
    { label: 'Username', value: form.username ? '@' + form.username : '-' },
    { label: 'Nome', value: form.full_name || '-' },
    { label: 'Et' + '\u00E0', value: form.age ? form.age + ' anni' : '-' },
    { label: 'Fisico', value: form.weight_kg && form.height_cm ? form.weight_kg + ' kg, ' + form.height_cm + ' cm' : '-' },
    { label: 'Obiettivo', value: form.goal ? pretty(form.goal) : '-' },
    { label: 'Attivit' + '\u00E0', value: form.activity_level ? pretty(form.activity_level) : '-' },
    { label: 'Dieta', value: form.diet_preference ? pretty(form.diet_preference) : 'Nessuna preferenza' },
  ]

  return (
    <div style={{ padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'rgba(48, 209, 88, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.3px' }}>
          Tutto pronto!
        </h2>
        <p style={{ fontSize: '14px', color: '#8E8E93', margin: '6px 0 0' }}>
          Ecco il tuo profilo. Potrai modificarlo dopo.
        </p>
      </div>

      <div
        style={{
          background: '#FFF',
          borderRadius: '14px',
          padding: '4px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: i < rows.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <span style={{ fontSize: '13px', color: '#8E8E93' }}>{row.label}</span>
            <span style={{ fontSize: '14px', color: '#000', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(255, 59, 48, 0.08)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#C53030',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <PrimaryButton onClick={onConfirm} disabled={loading}>
          {loading ? 'Creazione profilo...' : 'Entra in Fytra'}
        </PrimaryButton>
        <button
          onClick={onBack}
          style={{
            width: '100%',
            height: '48px',
            background: 'transparent',
            border: 'none',
            color: '#007AFF',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Modifica qualcosa
        </button>
      </div>
    </div>
  )
}
