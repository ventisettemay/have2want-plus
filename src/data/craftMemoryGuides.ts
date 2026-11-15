// Archivio Etico della Memoria Storica & Saper Fare Artigiano
// Esclusivamente soluzioni pratiche: come cambiare una lampadina, riparare tubi,
// vecchi mestieri, detti e saggezza popolare tramandata.
// ZERO geolocalizzazione forzata nelle vie, ZERO spese o pubblicità invasive.

export interface CraftMemoryGuide {
  id: string;
  title: string;
  category: 'fai-da-te' | 'elettricita' | 'idraulica' | 'vecchi-mestieri' | 'saggezza-popolare' | 'casa-ecologica';
  categoryLabel: string;
  difficulty: 'Facile' | 'Medio' | 'Saggezza Popolare';
  timeEstimate: string;
  materialsNeeded: string[];
  practicalSteps: string[];
  sayingOrWisdom: string; // Detto antico o trucco del maestro artigiano
  authorSign: string;
}

export const PRACTICAL_MEMORY_GUIDES: CraftMemoryGuide[] = [
  {
    id: 'mem-lampadina',
    title: 'Come cambiare una lampadina in sicurezza (e scegliere il portalampada giusto)',
    category: 'elettricita',
    categoryLabel: 'Piccola Elettricità Domestica',
    difficulty: 'Facile',
    timeEstimate: '5 minuti',
    materialsNeeded: [
      'Lampadina nuova (attacco E27 grande o E14 piccolo, preferibilmente LED)',
      'Panno morbido e asciutto',
      'Scala stabile o sedia solida'
    ],
    practicalSteps: [
      '1. Spegnere l\'interruttore della luce e, per massima prudenza, abbassare l\'interruttore generale del quadro elettrico.',
      '2. Attendere 2-3 minuti se la lampadina vecchia era a incandescenza o alogena per evitare scottature alle dita.',
      '3. Con il panno asciutto in mano, afferrare la vecchia lampadina e ruotare delicatamente in senso ANTIORARIO finché non si sfila.',
      '4. Controllare la filettatura interna: deve essere pulita e non ossidata.',
      '5. Inserire la nuova lampadina girando in senso ORARIO con tocco fermo ma senza forzare eccessivamente per non rompere la ceramica.',
      '6. Riattivare la corrente e accendere la luce per verificare.'
    ],
    sayingOrWisdom: '«Prima di toccare filo o candela, stacca il quadro e non si dispera.» — Regola aurea degli elettricisti di una volta.',
    authorSign: 'Mastro Giuseppe, elettricista in pensione'
  },
  {
    id: 'mem-rubinetto',
    title: 'Riparare un rubinetto che gocciola e sostituire la guarnizione',
    category: 'idraulica',
    categoryLabel: 'Idraulica Pratica',
    difficulty: 'Medio',
    timeEstimate: '20 minuti',
    materialsNeeded: [
      'Chiave a rullino o pinza a pappagallo',
      'Cacciavite a taglio',
      'Guarnizione di gomma o nastro di teflon (costo pochi centesimi)',
      'Straccio assorbente'
    ],
    practicalSteps: [
      '1. Chiudere la valvola dell\'acqua sotto al lavandino o la chiave d\'arresto principale della casa.',
      '2. Aprire il rubinetto per far defluire l\'acqua rimasta nel tubo.',
      '3. Rimuovere il tappino decorativo (solitamente rosso/blu) con la punta del cacciavite per scoprire la vite interna.',
      '4. Svitare la vite ed estrarre la manopola, poi svitare la cartuccia o vitone in senso antiorario con la chiave a rullino.',
      '5. Sostituire la rondella in gomma consumata alla base con una nuova delle stesse dimensioni, oppure avvolgere 3 giri di teflon sulla filettatura.',
      '6. Riavvitare delicatamente senza stringere alla morte (la gomma fa tenuta da sola) e riaprire l\'acqua.'
    ],
    sayingOrWisdom: '«Acqua che gocciola scava la pietra e svuota la tasca.» — Antico proverbio contadino.',
    authorSign: 'Zio Antonio, idraulico del borgo'
  },
  {
    id: 'mem-porta-cigolante',
    title: 'Eliminare il cigolio di porte e persiane senza comprare prodotti chimici',
    category: 'fai-da-te',
    categoryLabel: 'Cura della Casa Tradizionale',
    difficulty: 'Facile',
    timeEstimate: '3 minuti',
    materialsNeeded: [
      'Saponetta solida asciutta (di Marsiglia) o cera di candela',
      'In alternativa: una goccia di olio d\'oliva o vaselina',
      'Carta assorbente'
    ],
    practicalSteps: [
      '1. Aprire e chiudere la porta individuando quale dei 2 o 3 cardini produce il rumore.',
      '2. Strofinare energicamente la saponetta asciutta o la candela direttamente sul perno visibile del cardine.',
      '3. Se il cardine è stretto, sollevare la porta di mezzo centimetro con una zeppa e applicare una sola goccia d\'olio con uno stecchino.',
      '4. Muovere la porta avanti e indietro 5 volte per far penetrare il lubrificante naturale.',
      '5. Pulire l\'eccesso con lo straccio.'
    ],
    sayingOrWisdom: '«Il sapone lava il corpo e fa tacere la porta rumorosa.» — Consiglio dei nonni.',
    authorSign: 'Nonna Maria, custode della casa'
  },
  {
    id: 'mem-legno-graffio',
    title: 'Cancellare graffi dai mobili in legno massello con una noce',
    category: 'vecchi-mestieri',
    categoryLabel: 'Segreti degli Ebanisti',
    difficulty: 'Facile',
    timeEstimate: '2 minuti',
    materialsNeeded: [
      'Un gheriglio di noce fresca sgusciata',
      'Panno di lana morbido'
    ],
    practicalSteps: [
      '1. Pulire bene la superficie del legno rimuovendo polvere o cera con un panno.',
      '2. Strofinare direttamente la polpa del gheriglio di noce lungo il solco del graffio.',
      '3. Gli oli naturali della noce penetrano nelle fibre compattando il legno e uniformando il colore.',
      '4. Lasciare riposare 5 minuti, poi lucidare con il panno di lana con movimenti circolari.'
    ],
    sayingOrWisdom: '«Il legno è vivo: dagli il suo olio naturale e ringiovanirà di cento anni.» — Mastro falegname Carlo.',
    authorSign: 'Bottega Ebanisteria Tradizionale'
  },
  {
    id: 'mem-orto-macerato',
    title: 'Difendere l\'orto e le piante da afidi e parassiti con il macerato d\'ortica',
    category: 'casa-ecologica',
    categoryLabel: 'Coltivazione Naturale',
    difficulty: 'Facile',
    timeEstimate: '10 min + 48h macerazione',
    materialsNeeded: [
      '1 kg di ortica fresca con guanti da giardino',
      'Secchio di plastica da 10 litri d\'acqua (preferibilmente piovana)',
      'Spruzzino nebulizzatore'
    ],
    practicalSteps: [
      '1. Raccogliere le ortiche prima della fioritura e immergerle nel secchio d\'acqua.',
      '2. Coprire con una rete e lasciare all\'ombra per 48 ore mescolando una volta al giorno.',
      '3. Filtrare il liquido scuro con un colino e diluirlo 1 a 10 con acqua pulita.',
      '4. Spruzzare sulle foglie al tramonto: fertilizza la pianta con azoto e allontana afidi e acari senza veleni.'
    ],
    sayingOrWisdom: '«Quello che punge la mano guarisce la pianta.» — Saggezza degli ortolani antichi.',
    authorSign: 'Comunità Rurale Solidale'
  }
];
