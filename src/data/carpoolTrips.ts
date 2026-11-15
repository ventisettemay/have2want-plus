// Modulo Carpooling & Trasferte Libere tra Utenti
// ZERO commissioni, ZERO conversioni forzate, ZERO tariffe imposte dall'app.
// Solo contatto libero e reciproco accordo tra privati.

export interface CarpoolTrip {
  id: string;
  driverName: string;
  driverRating: number;
  originCity: string;
  destinationCity: string;
  intermediateStops: string[]; // Es. ['Bologna', 'Firenze']
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  vehicleModel: string;
  notes: string;
  contactType: 'chat_diretta' | 'telefono_volontario';
  suggestedPiContribution?: string; // Indicazione libera, nessuna trattenuta dall'app
}

export const SAMPLE_GLOBAL_CARPOOLS: CarpoolTrip[] = [
  {
    id: 'trip-1',
    driverName: 'Marco P.',
    driverRating: 4.9,
    originCity: 'Milano',
    destinationCity: 'Roma',
    intermediateStops: ['Bologna', 'Firenze'],
    departureDate: 'Domani',
    departureTime: '07:30',
    availableSeats: 3,
    vehicleModel: 'Station Wagon Ibrida spaziosa',
    notes: 'Viaggio tranquillo con bagagliaio capiente, gradita musica leggera e condivisione spese autostrada a piacere.',
    contactType: 'chat_diretta',
    suggestedPiContribution: 'Spese condivise liberamente tra viaggiatori'
  },
  {
    id: 'trip-2',
    driverName: 'Elena R.',
    driverRating: 5.0,
    originCity: 'Torino',
    destinationCity: 'Genova',
    intermediateStops: ['Asti', 'Alessandria'],
    departureDate: 'Venerdì',
    departureTime: '18:00',
    availableSeats: 2,
    vehicleModel: 'Compatta Elettrica',
    notes: 'Ritorno weekend verso la costa ligure. Posso caricare passeggeri anche ad Asti ovest.',
    contactType: 'chat_diretta',
    suggestedPiContribution: 'Accordo libero privato'
  },
  {
    id: 'trip-3',
    driverName: 'Julien B.',
    driverRating: 4.8,
    originCity: 'Parigi',
    destinationCity: 'Lione',
    intermediateStops: ['Auxerre', 'Digione'],
    departureDate: 'Sabato',
    departureTime: '09:00',
    availableSeats: 4,
    vehicleModel: 'Minivan 7 posti',
    notes: 'Tratta internazionale verso il sud della Francia. Spazio per valigie grandi o bicicletta pieghevole.',
    contactType: 'chat_diretta',
    suggestedPiContribution: 'Condivisione etica'
  }
];
