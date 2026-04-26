"use client"

import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F7' }}>
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          minHeight: '100vh',
          background: '#FFF',
          padding: '0 0 40px',
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '12px 16px',
            borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10,
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
              color: '#007AFF',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Privacy Policy</h1>
        </header>

        <article style={{ padding: '24px', fontSize: '14px', lineHeight: 1.6, color: '#1F2421' }}>
          <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: 0 }}>
            Ultimo aggiornamento: 24 aprile 2026
          </p>

          <H1>1. Chi siamo</H1>
          <p>
            Fytra (di seguito anche {'"'}l{'\u2019'}App{'"'} o {'"'}il Servizio{'"'}) {'\u00E8'} un servizio in fase di beta-test gestito da Gregorio De Blasi, persona fisica con sede in Italia. L{'\u2019'}App {'\u00E8'} attualmente offerta gratuitamente a fini di test e validazione del prodotto.
          </p>

          <H1>2. Dati che raccogliamo</H1>
          <p>Quando usi Fytra raccogliamo i seguenti dati:</p>
          <Ul>
            <Li><strong>Dati di registrazione:</strong> indirizzo email e password (cifrata con bcrypt, mai in chiaro).</Li>
            <Li><strong>Dati di profilo:</strong> nome, cognome, username, foto profilo (opzionale), data di nascita, sesso biologico, peso, altezza, livello di attivit{'\u00E0'} fisica, obiettivo (perdita peso, mantenimento, ecc.), tipo di lavoro, preferenze alimentari, allergie, frequenza allenamento, ore di sonno, motivazione personale.</Li>
            <Li><strong>Contenuti generati:</strong> post, foto dei pasti, descrizioni, ingredienti registrati, dati allenamento, commenti, mi piace, follow.</Li>
            <Li><strong>Dati tecnici:</strong> indirizzo IP, tipo di dispositivo, browser, sistema operativo, log di accesso. Questi dati sono raccolti tramite Vercel (hosting) e Supabase (backend).</Li>
          </Ul>

          <H1>3. Perch{'\u00E9'} raccogliamo questi dati</H1>
          <Ul>
            <Li>Per farti usare l{'\u2019'}App: senza email/password non puoi accedere, senza profilo non puoi pubblicare.</Li>
            <Li>Per personalizzare l{'\u2019'}esperienza: gli obiettivi e le preferenze servono a calcolare suggerimenti adatti a te.</Li>
            <Li>Per far funzionare il social: post, like e follower devono essere visibili agli altri utenti come funzione del servizio.</Li>
            <Li>Per migliorare l{'\u2019'}App: analizziamo dati aggregati e anonimi (mai individuali) per capire cosa funziona e cosa no.</Li>
            <Li>Per la sicurezza: log e IP servono a prevenire abusi.</Li>
          </Ul>

          <H1>4. Chi vede i tuoi dati</H1>
          <p>
            <strong>Dati visibili agli altri utenti:</strong> il tuo username, nome (se inserito), foto profilo, post pubblici e relativi ingredienti (i nomi, non le quantit{'\u00E0'}), commenti, mi piace, numero follower e seguiti.
          </p>
          <p>
            <strong>Dati visibili solo a te:</strong> obiettivo (perdere grasso, massa, ecc.), peso, altezza, et{'\u00E0'}, dieta, allergie, totali nutrizionali dei tuoi pasti (kcal, proteine, carboidrati, grassi).
          </p>
          <p>
            <strong>Dati visibili al gestore del servizio (Gregorio De Blasi):</strong> tutti i dati sopra, per fini di amministrazione tecnica del servizio.
          </p>
          <p>
            <strong>Non vendiamo n{'\u00E9'} cediamo i tuoi dati a terze parti per finalit{'\u00E0'} di marketing.</strong> Eccezioni: fornitori tecnici necessari per far funzionare il servizio (Vercel, Supabase), che agiscono come responsabili del trattamento.
          </p>

          <H1>5. Dove sono conservati i dati</H1>
          <p>
            I dati di account, profilo, post e commenti sono conservati su <strong>Supabase</strong> (server in Europa). Il sito {'\u00E8'} hostato su <strong>Vercel</strong> (server in Europa o USA a seconda della regione di accesso).
          </p>

          <H1>6. Quanto conserviamo i dati</H1>
          <p>
            Conserviamo i tuoi dati finch{'\u00E9'} il tuo account {'\u00E8'} attivo. Se chiedi la cancellazione dell{'\u2019'}account, eliminiamo tutti i tuoi dati personali e contenuti entro 30 giorni dalla richiesta. Alcuni log tecnici (IP, accessi) vengono conservati fino a 12 mesi per motivi di sicurezza.
          </p>

          <H1>7. I tuoi diritti (GDPR)</H1>
          <p>Hai diritto a:</p>
          <Ul>
            <Li>Accedere ai tuoi dati personali</Li>
            <Li>Correggerli se sono sbagliati</Li>
            <Li>Cancellarli ({'"'}diritto all{'\u2019'}oblio{'"'})</Li>
            <Li>Limitare il trattamento</Li>
            <Li>Portarli ad altro servizio (esportazione)</Li>
            <Li>Opporti al trattamento</Li>
            <Li>Reclamare al Garante Privacy italiano</Li>
          </Ul>
          <p>
            Per esercitare questi diritti scrivi a: <strong>fytra.app.contact@gmail.com</strong> (o l{'\u2019'}email che configurerai).
          </p>

          <H1>8. Sicurezza</H1>
          <p>
            Adottiamo misure tecniche ragionevoli per proteggere i tuoi dati: HTTPS in tutto il traffico, password cifrate, controlli di accesso al database (RLS), backup automatici. <strong>Tuttavia nessun sistema {'\u00E8'} sicuro al 100%.</strong> Fytra {'\u00E8'} attualmente in beta: ti consigliamo di non inserire dati molto sensibili (es. dati medici dettagliati, condizioni cliniche specifiche).
          </p>

          <H1>9. Minori</H1>
          <p>
            Fytra non {'\u00E8'} destinato a minori di 14 anni. Se hai meno di 18 anni devi avere il consenso di un genitore o tutore legale per registrarti e usare il servizio.
          </p>

          <H1>10. Cookie</H1>
          <p>
            Usiamo cookie tecnici essenziali per mantenerti loggato. Non usiamo cookie di profilazione o marketing di terze parti. Vercel pu{'\u00F2'} usare cookie tecnici di analytics aggregata.
          </p>

          <H1>11. Modifiche</H1>
          <p>
            Possiamo aggiornare questa Privacy Policy. La data di {'"'}ultimo aggiornamento{'"'} in alto cambier{'\u00E0'}. Modifiche sostanziali ti saranno comunicate tramite l{'\u2019'}App o via email.
          </p>

          <H1>12. Contatti</H1>
          <p>
            Per qualsiasi domanda sulla privacy o per esercitare i tuoi diritti:<br />
            <strong>fytra.app.contact@gmail.com</strong>
          </p>

          <div style={{ marginTop: '40px', padding: '16px', background: '#F2F2F7', borderRadius: '12px', fontSize: '12px', color: '#8E8E93' }}>
            <p style={{ margin: 0 }}>
              Fytra {'\u00E8'} attualmente in fase di beta-test gratuito. Questa privacy policy potrebbe essere ampliata quando l{'\u2019'}App entrer{'\u00E0'} in versione pubblica con eventuali piani a pagamento.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#000', margin: '24px 0 8px' }}>
      {children}
    </h2>
  )
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>{children}</ul>
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ marginBottom: '4px' }}>{children}</li>
}
