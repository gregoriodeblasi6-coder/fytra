"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

export default function RootPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    // Utente loggato: verifica se ha completato l'onboarding
    checkProfile()
  }, [user, authLoading])

  const checkProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .maybeSingle()

    if (data && data.username) {
      router.replace('/feed')
    } else {
      router.replace('/onboarding')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F2F2F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid #E5E5EA',
          borderTopColor: '#7CA982',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  )
}
