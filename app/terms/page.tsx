"use client"

import { useRouter } from 'next/navigation'

export default function TermsPage() {
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
          <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Termini di Servizio</h1>
        </header>

        <article style={{ padding: '24px', fontSize: '14px', lineHeight: 1.6, color: '#1F2421' }}>
          <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: 0 }}>
            Ultimo aggiornamento: 24 aprile 2026
          </p>

          <p>
            Benvenuto/a su Fytra. Usando questa applicazione accetti i presenti Termini di Servizio.
          </p>

          <H1>1. Cos{'\u2019\u00E8'} Fytra</H1>
          <p>
            Fytra {'\u00E8'} un servizio social di benessere e fitness, attualmente in <strong>fase di beta-test gratuito</strong>. Permette agli utenti di pubblicare i propri pasti, allenamenti, seguire altri utenti, mettere mi piace, commentare, e tracciare i propri progressi. Fytra include funzioni AI di supporto (in sviluppo).
          </p>

          <H1>2. Chi pu{'\u00F2'} usare Fytra</H1>
          <Ul>
            <Li>Devi avere almeno 14 anni</Li>
            <Li>Se hai meno di 18 anni, ti serve il consenso di un genitore</Li>
            <Li>Devi fornire informazioni vere durante la registrazione</Li>
            <Li>Devi rispettare gli altri utenti</Li>
          </Ul>

          <H1>3. Il tuo account</H1>
          <p>
            Sei responsabile della sicurezza del tuo account: usa una password robusta, non condividerla con altri. Sei responsabile di tutto quello che viene fatto dal tuo account.
          </p>
          <p>
            Possiamo sospendere o eliminare il tuo account se violi questi termini, pubblichi contenuti inappropriati, o usi il servizio in modo dannoso per altri utenti.
          </p>

          <H1>4. Cosa puoi pubblicare</H1>
          <p>Puoi pubblicare contenuti che riguardano alimentazione, allenamento, benessere, ricette, foto dei tuoi pasti.</p>
          <p><strong>NON puoi pubblicare:</strong></p>
          <Ul>
            <Li>Contenuti illegali, violenti, sessuali, discriminatori, offensivi</Li>
            <Li>Contenuti di terze parti senza diritti (foto altrui, marchi, copyright)</Li>
            <Li>Spam, pubblicit{'\u00E0'} non autorizzata, link sospetti</Li>
            <Li>Consigli medici dannosi o disinformazione sulla salute</Li>
            <Li>Promozione di disturbi alimentari (anoressia, bulimia, regimi estremi)</Li>
            <Li>Sostanze illegali, farmaci, doping sportivo</Li>
          </Ul>
          <p>
            Ci riserviamo il diritto di rimuovere contenuti che violano queste regole, senza preavviso.
          </p>

          <H1>5. Diritti sui contenuti che pubblichi</H1>
          <p>
            I contenuti che pubblichi rimangono di tua propriet{'\u00E0'}. Tuttavia, pubblicandoli ci concedi una <strong>licenza non esclusiva, gratuita, mondiale</strong> per ospitare, mostrare, distribuire e modificare tecnicamente (es. ridimensionare foto) i tuoi contenuti per il funzionamento del servizio.
          </p>
          <p>
            Non useremo le tue foto o i tuoi post in materiale di marketing senza il tuo consenso esplicito.
          </p>

          <H1>6. Fytra non {'\u00E8'} consulto medico</H1>
          <p>
            <strong>Importante.</strong> Fytra {'\u00E8'} un servizio di tracking e socialit{'\u00E0'}, NON un servizio di consulenza medica, nutrizionale o sportiva professionale.
          </p>
          <Ul>
            <Li>I dati nutrizionali calcolati sono <strong>stime</strong>, non valori esatti</Li>
            <Li>I suggerimenti dell{'\u2019'}AI sono <strong>indicativi</strong>, non prescrizioni</Li>
            <Li>Per qualsiasi questione di salute, dieta speciale, condizioni mediche, allenamento agonistico → <strong>consulta un professionista qualificato</strong> (medico, nutrizionista, personal trainer)</Li>
            <Li>Se hai disturbi alimentari, gravidanza, condizioni cardiache o altre patologie, parla con il tuo medico prima di seguire qualsiasi suggerimento da Fytra</Li>
          </Ul>

          <H1>7. Disponibilit{'\u00E0'} del servizio</H1>
          <p>
            Fytra {'\u00E8'} in beta. Pu{'\u00F2'} avere malfunzionamenti, dati persi, downtime imprevisti. Non garantiamo disponibilit{'\u00E0'} continua. Se l{'\u2019'}App ha problemi, faremo del nostro meglio per risolverli ma non sei legalmente obbligato a indennizzi.
          </p>

          <H1>8. Costi e versioni future</H1>
          <p>
            Attualmente Fytra {'\u00E8'} <strong>gratuito</strong>. In futuro potremmo introdurre piani a pagamento per funzioni avanzate (es. AI Coach personalizzato, statistiche avanzate). Le funzioni base resteranno comunque gratuite o saranno chiaramente indicate prima di qualsiasi pagamento.
          </p>

          <H1>9. Cancellazione account</H1>
          <p>
            Puoi cancellare il tuo account in qualsiasi momento dalle impostazioni del profilo, oppure scrivendo a <strong>fytra.app.contact@gmail.com</strong>. Cancellando l{'\u2019'}account vengono eliminati tutti i tuoi dati personali entro 30 giorni.
          </p>

          <H1>10. Limitazione di responsabilit{'\u00E0'}</H1>
          <p>
            Nel limite massimo consentito dalla legge italiana ed europea, Fytra e Gregorio De Blasi non sono responsabili per danni indiretti derivanti dall{'\u2019'}uso del servizio, incluse perdite di dati, mancato guadagno, danni reputazionali. Per danni diretti la responsabilit{'\u00E0'} massima {'\u00E8'} pari a quanto eventualmente pagato dall{'\u2019'}utente nei 12 mesi precedenti.
          </p>

          <H1>11. Legge applicabile</H1>
          <p>
            Questi termini sono regolati dalla legge italiana. Per qualsiasi controversia il foro competente {'\u00E8'} quello del luogo di residenza del consumatore (per consumatori) o di Roma (per utenti professionali).
          </p>

          <H1>12. Modifiche ai termini</H1>
          <p>
            Possiamo modificare questi termini. La nuova versione sar{'\u00E0'} pubblicata in questa pagina con data aggiornata. Modifiche significative saranno comunicate tramite l{'\u2019'}App o via email.
          </p>

          <H1>13. Contatti</H1>
          <p>
            Per qualsiasi domanda su questi termini scrivi a:<br />
            <strong>fytra.app.contact@gmail.com</strong>
          </p>

          <div style={{ marginTop: '40px', padding: '16px', background: '#F2F2F7', borderRadius: '12px', fontSize: '12px', color: '#8E8E93' }}>
            <p style={{ margin: 0 }}>
              Usando Fytra dichiari di aver letto, capito e accettato questi Termini di Servizio e la Privacy Policy.
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
