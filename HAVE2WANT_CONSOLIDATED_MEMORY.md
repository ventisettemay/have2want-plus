# HAVE2WANT — MEMORIA CONSOLIDATA DI PROGETTO

*Documento unificato per trasferimento a Kilo. Combina: specifiche funzionali originali (10 sezioni) + aggiornamento memoria precedente + aggiornamento DEFIANCE PULSE. Nessuna decisione è stata sovrascritta; le sezioni si integrano.*

---

## PARTE A — SPECIFICHE FUNZIONALI ORIGINALI (10 SEZIONI)

### 1. APPLICAZIONE PRINCIPALE — HAVE2WANT
Schermata principale pulita, ordinata, visivamente perfetta, facile da utilizzare, priva di elementi inutili. Deve presentare chiaramente il globo, i satelliti e le funzioni principali.

### 2. GLOBO 3D — Globo3D
Centro geografico e visivo. Visualizzazione 3D Terra, rappresentazione geopolitica, confini nazionali, identificazione/selezione Paesi, visualizzazione territori, esplorazione geografica mondiale, visualizzazione 11 satelliti, selezione satelliti, visualizzazione meteorologica/radar, passaggio a visualizzazione urbana. Componente geopolitica importante: non sfera decorativa.

### 3. MAPVIEW3DCONTAINER — COLLEGAMENTO GLOBO E CITTÀ
Collega visualizzazione mondiale con urbana. Selezione territorio → passaggio globo→urbano, mantenimento territorio, attivazione funzioni geografiche/navigazione, visualizzazione POI prodotti/attività zona. **Presenza commerciale distinta da pubblicità. Categorie distinte di presenza commerciale e visibilità.**

### 4. SISTEMA COMMERCIALE — TRE REALTÀ DISTINTE
**A. Marketplace interno (MARKET_SAT):** solo utenti HAVE2WANT — prodotti, annunci, compravendita, ricerca interna, gestione inserzioni, ordini, pagamenti Pi, Conferma di acquisto. No Amazon/eBay/Subito. No confusione con vetrine pubblicitarie.
**B. Satellite negozi/attività:** gestione separata da annunci utenti. Presenza commerciale, vetrina, info attività, prodotti/servizi, gestione attività. Pubblicità negozi ≠ annunci utenti.
**C. Marketplace esterno:** separato da interno. Ricerca esterna, identificazione piattaforma provenienza, risultati esterni, link originali, link affiliati, commissioni esterne. No mescolanza con prodotti utenti.

### 5. COMMERCIANTI E ACCETTAZIONE PI — TRE CONDIZIONI
**A. Commercianti presenti geograficamente:** parte rappresentazione territorio, visibili su mappe senza essere automaticamente pubblicizzati.
**B. Commercianti che accettano Pi:** circuito adesione Pi (quota simbolica), riconoscibili per simbolo Pi. Non confusi con pubblicità VIP.
**C. Commercianti VIP pubblicizzati:** satellite dedicato (BUSINESS_ADS_SAT), scheda pubblicitaria, vetrina, visibilità evidenza. Distinguibili da normali e Pi-accepting.

### 6. VISUALIZZAZIONE NAVIGAZIONE STRADALE
Tutte categorie commerciali in mappe stradali/navigazione. Distinzioni:
- Normale: logo semplice
- Aderente Pi: simbolo Pi per adesione
- VIP: evidenziazione cornice LED + simbolo Pi
Presenza geografica ≠ evidenziazione pubblicitaria. Normali hanno spazio ma non visibilità VIP.

### 7. URBANO3D — NAVIGAZIONE URBANA REALE
Navigazione reale, non finta. Dati geografici effettivi. Strade reali, edifici reali, incroci/piazze, mappe stradali, GPS, percorsi reali, POI reali, attività geolocalizzate, prodotti/servizi collegati territorio, visualizzazione commerciale per regole. No città inventate, no attività inesistenti. 3D = territorio reale via dati cartografici verificabili.

### 8. CONFERMA DI ACQUISTO
Funzione precedentemente "Stretta di Mano" deve chiamarsi **CONFERMA DI ACQUISTO**. Non usare più "Stretta di Mano" in UI utenti. Analizzare: avvio, coinvolgimento acquirente/venditore, collegamento ordine, collegamento pagamento, registrazione conclusione. Non modificare logica senza approvazione.

### 9. VERIFICA CODICE ESISTENTE
Confrontare indicazioni con funzioni già presenti: Globo3D, MapView3DContainer, Urbano3D, OrbitalSatellitesHub, MARKET_SAT, Satellite negozi, VIP advertising, Pi acceptance, POI geografici, Privacy geografica, Marketplace interno, Marketplace esterno, Conferma di acquisto. Per ciascuna: cosa fa, cosa mostra, dati usati, dipendenze, reale/simulato, cosa manca, conformità.

### 10. REGOLA FONDAMENTALE
HAVE2WANT deve rispettare la visione del proprietario. Kilo analizza, documenta, segnala. Non decisioni autonome. Nessuna modifica approvata solo perché suggerita da AI. Prima si comprende, poi proprietario decide.

---

## PARTE B — AGGIORNAMENTO MEMORIA PRECEDENTE (PIN, SATELLITI, MARKETPLACE, COMMUNITY, VIDEO)

### 1. Atlante mondiale e navigazione
Tre elementi collegati:
- Globo PIN geopolitico: mondo, paesi, confini, territori
- PIN urbano: accesso visualizzazione urbana
- PIN territoriali: presenze e punti di interesse
Regola: selezionando PIN globo → entra direttamente in visualizzazione urbana territorio corrispondente. Navigazione stradale 3D reale se tecnicamente possibile.

### 2. Satelliti collegati al globo
Due categorie:
- Satelliti collegati al globo: accessibili selezionandoli
- Satelliti esterni: non collegati, non accessibili tramite selezione globo
Selezione satellite → visualizza PIN sua tipologia, esclude altri, per regole specifiche satellite.

### 3. PIN commerciali e territoriali
- PIN commerciali su globo e mappe territoriali
- Non aprono scheda completa attività
- Scheda completa via satellite commerciale
- PIN identifica presenza territorio, non prodotto
- **Piccola scheda informativa** (proposta accolta, grafica da definire): identifica punto come attività/luogo/servizio, mostra nome e categoria, evita confusione con scheda prodotto, indirizza a satellite dedicato

### 4. Marketplace interno
Annunci utenti: spazio proprio, satellite dedicato (MARKET_SAT), non confusi con PIN commerciali su mappe.

### 5. Marketplace esterno
Satellite separato da interno. Funzioni: prodotti piattaforme esterne, immagini, nome prodotto, nome/identificazione piattaforma provenienza, link piattaforme per acquisto.
**Priorità commerciale:** piattaforme che pagano visibilità → priorità. Pagamento in **criptovaluta** (no valute tradizionali, no PayPal). Criptovaluta specifica, sistema pagamento, regole priorità da definire.

### 6. Satellite Community
Satellite dedicato. Se selezionato: esclude PIN altre categorie, mostra solo PIN utenti in linea, identificati simboli uomo/donna.
Finalità utenti: amicizia, socialità, compagnia, incontri sentimentali. Voce per finalità scelta. Da decidere: sezione dedicata incontri vs solo categorie sociali.

### 7. Nuova funzione video interna — NOME CONFERMATO
**SIMPLE. DISCREET. DIFFERENT PULSE.** — Nome completo funzione video interna. Non nome logo, non sostituisce motto HAVE2WANT.
Spazio contenuti multimediali/condivisione, simile video brevi social ma identità propria.
Categorie: video brevi, intrattenimento, persone/socialità, mestieri/professioni, prodotti/commercio, viaggi/territori, cultura/conoscenza, sport/passioni, arte/creatività, vita quotidiana.
Funzioni da valutare: pubblicazione video verticali, visualizzazione, like, commenti, condivisione, follow, feed personalizzato, raccomandazione.

### 8. Decisioni da non modificare
1. Logo HAVE2WANT mantiene motto: SIMPLE. DISCREET.
2. SIMPLE. DISCREET. DIFFERENT PULSE. = nome completo funzione video.
3. Marketplace interno/esterno separati.
4. PIN commerciali = luoghi/attività, non prodotti.
5. Info complete attività via satellite dedicato.
6. Annunci utenti = satellite proprio.
7. Community = solo utenti in linea quando satellite selezionato.
8. Pagamenti visibilità marketplace esterno = criptovaluta, no fiat, no PayPal.

### 9. Questioni aperte
- Grafica/comportamento piccola scheda PIN
- Modalità accesso marketplace esterno
- Criptovaluta e sistema pagamento pubblicità esterna
- Organizzazione definitiva Community e incontri
- Funzioni complete sezione video
- Verifica navigazione urbana 3D

### 10. Istruzioni per Kilo
Conservare decisioni confermate. Non modificare nomi autonomamente. Non inventare funzioni non documentate. Verificare tecnicamente codice esistente. Separare funzioni esistenti/simulate/da sviluppare. Procedere un elemento alla volta, chiedere conferma.

---

## PARTE C — AGGIORNAMENTO DEFIANCE PULSE E SISTEMA PUBBLICITARIO

### 1. IDENTITÀ PRINCIPALE
- Marchio: HAVE2WANT
- Motto ufficiale: SIMPLE. DISCREET. (non modificabile)
- Non modificare autonomamente nomi, struttura, identità

### 2. ACTIONFLOW HUB
Applicazione presente in ecosistema. Identità grafica non modificata per ora. Eventuale aggiornamento valutato successivamente.

### 3. DEFIANCE PULSE
**Nome confermato** per nuova funzione multimediale interna a HAVE2WANT.
Identità visiva: futuristica, provocatoria, tecnologica, dinamica.
Integrazione logo principale: valutazione successiva.

### 4. AREE DI DEFIANCE PULSE (4 approvate)
1. **DEFIANCE PULSE CREATOR** — Creatori contenuti, persone che vogliono presentarsi/promuoversi
2. **DEFIANCE PULSE MUSIC** — Musicisti, cantanti, DJ, gruppi, produzioni musicali
3. **DEFIANCE PULSE VIDEO** — Video/intrattenimento, cultura/conoscenza, viaggi, sport/passioni, vita quotidiana
4. **DEFIANCE PULSE PROMOTION** — Pubblicità commercianti, professionisti, aziende, prodotti/servizi, promozione personale

### 5. PRODUZIONE CONTENUTI CON AI
Piattaforma deve partire con contenuti AI. Contenuti iniziali: mestieri antichi/moderni, riparazioni/manutenzioni, automobili, idraulica, lavori domestici, artigianato, cucina, giardinaggio, cultura/curiosità. Non servono commercianti/professionisti reali per primi contenuti. AI per video dimostrativi/didattici. Verificare strumenti AI gratuiti (limiti, qualità, diritti uso commerciale).

### 6. DEFIANCE PULSE AI CREATOR
Funzione per creare contenuti via AI. Applicazioni: video pubblicitari, presentazioni commerciali, video dimostrativi mestieri, contenuti storici, video artisti/musicisti, promozione prodotti/servizi.

### 7. DEFIANCE PULSE AI VISION
Funzione proposta: utente scatta foto → inquadra problema → invia ad AI → riceve analisi → soluzioni/suggerimenti. Esempi: pianta foglie danneggiate, rubinetto perde, problemi domestici, oggetti danneggiati, anomalie auto. AI segnala info insufficienti / serve professionista. Affidabilità e motore AI da verificare. Architettura pluggable per cambiare fornitore AI.

### 8. SERVIZI A PAGAMENTO PER COMMERCIANTI
DEFIANCE PULSE AI CREATOR offrirà servizi commerciali a pagamento: creazione pagine commerciali, produzione video pubblicitari, presentazione attività, video prodotti, presentazione professionisti, campagne promozionali, produzione periodica contenuti. Commerciante acquista autonomamente via HAVE2WANT. Prezzi da definire.

### 9. SISTEMA PUBBLICITARIO HAVE2WANT ADS
Circuito pubblicitario inizialmente interno. Flusso: commerciante acquista servizio → crea/commissiona contenuto → contenuto in gestione ADS → HAVE2WANT distribuisce a utenti → futuro: integrazione canali esterni (es. Google Ads). Pubblicità esterna non ancora integrata.

### 10. PROMOZIONE INIZIALE DEFIANCE PULSE
Contenuti AI prima lancio → video interessanti → promuovere via HAVE2WANT → richiami pubblicitari interni. Non aspettare commercianti per primi contenuti.

### 11. SISTEMA VISIVO BANNER
Direzione approvata: **piccolo puntino animato**. Comportamento: compare → si ingrandisce → mostra contenuto → rimane secondi → si restringe/scompare. Uso: promozioni funzioni interne, pubblicità commercianti, pubblicità aziende/inserzionisti. Discreto, non invasivo, non full-page. Posizione, dimensioni, frequenza, animazione definite dopo verifica layout. Stessa impostazione per HAVE2WANT ADS.

### 12. GESTIONE AUTONOMA PUBBLICITÀ
Commercianti: registrarsi inserzionisti, creare campagne, scegliere cosa pubblicizzare, caricare immagini/video, stabilire durata, pagare servizio, consultare statistiche. Controllo contenuti prima pubblicazione.

### 13. PRINCIPIO ECONOMICO
**NESSUN SERVIZIO PUBBLICITARIO VIENE REGALATO.**
- Ogni servizio pubblicitario a pagamento
- Ogni campagna ha costo
- No concessioni gratuite automatiche
- Sconti/promozioni decise da proprietario
- Tariffe, pacchetti, modalità pagamento da stabilire

### 14. QUESTIONI DA DEFINIRE
- Strumenti AI gratuiti e condizioni uso commerciale
- Implementazione tecnica AI CREATOR
- Implementazione tecnica AI VISION
- Prezzi servizi commerciali
- Sistema di pagamento
- Gestione/distribuzione campagne ADS
- Posizione/dimensioni banner
- Statistiche pubblicitarie
- Integrazione circuiti esterni
- Verifica interesse effettivo utenti

### 15. ISTRUZIONI PER KILO
- Verificare sempre codice esistente prima di intervenire
- Non dichiarare operative funzioni solo progettate
- Distinguere funzioni esistenti, simulate, da sviluppare
- Non modificare funzioni già approvate senza autorizzazione
- Non inventare comportamenti
- Procedere un elemento alla volta
- Non sviluppare servizi a pagamento senza concordare condizioni
- Mantenere separati HAVE2WANT, ACTIONFLOW HUB, DEFIANCE PULSE
- Lasciare al proprietario tutte le decisioni definitive

**OBIETTIVO:** sviluppare HAVE2WANT come ecosistema commerciale e multimediale sostenibile, mantenendo intatta la visione del proprietario.

---

## NOTA PER KILO: TRASFERIMENTO MEMORIA
Questo documento unifica tre fonti sequenziali senza sostituzioni:
1. Specifiche funzionali originali (10 sezioni) — base architetturale
2. Aggiornamento memoria PIN/satelliti/marketplace/community/video — decisioni operative
3. Aggiornamento DEFIANCE PULSE/ADS/AI — nuova direzione multimediale/commerciale

Tutte le decisioni restano valide. Le questioni aperte (Parte B §9, Parte C §14) richiedono ancora definizione. Procedere per priorità concordate col proprietario.