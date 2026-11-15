const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '../public/data/world_countries.json');
const outSvgPath = path.join(__dirname, '../public/textures/earth_political.svg');

const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Risoluzione 4K Ultra-HD per massima nitidezza sia da lontano che da vicino
const WIDTH = 4096;
const HEIGHT = 2048;

function project(lng, lat) {
  // Plate Carrée (Equirectangular)
  const x = ((lng + 180) / 360) * WIDTH;
  const y = ((90 - lat) / 180) * HEIGHT;
  return [x, y];
}

function coordsToSvgPath(coords, isMulti) {
  let d = '';
  const polygons = isMulti ? coords : [coords];

  for (const ringList of polygons) {
    for (let r = 0; r < ringList.length; r++) {
      const ring = ringList[r];
      if (!ring || ring.length === 0) continue;
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i];
        const [x, y] = project(lng, lat);
        if (i === 0) {
          d += `M ${x.toFixed(1)} ${y.toFixed(1)} `;
        } else {
          d += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
        }
      }
      d += 'Z ';
    }
  }
  return d;
}

// Palette cartografica CLASSICA ELEGANTE, SCURA, OPACA E RIPOSANTE PER LA VISTA
// Zero abbagliamento: toni terracotta, salvia, ocra brunito, bosco, ambra, prugna
const PALETTE = [
  '#b35434', // Terracotta scuro caldo
  '#3b6e4e', // Verde salvia bosco riposante
  '#b8860b', // Ocra brunito caldo
  '#345f87', // Blu oltremare tenue
  '#6b4c7a', // Prugna elegante
  '#2f7a6d', // Petrolio scuro
  '#a66829', // Ambra antico
  '#843b46', // Amaranto / bordeaux tenue
  '#4a7043', // Verde oliva scuro
  '#535c68', // Ardesia neutro
  '#8b572a', // Cuoio caldo
  '#40617a', // Indaco opaco
];

let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">\n`;

// 1. Sfondo Oceani: Blu mare profondo cartografico elegante (riposante per gli occhi, zero bianco o neon)
svg += `  <rect width="${WIDTH}" height="${HEIGHT}" fill="#162e47"/>\n`;

// 2. Griglia geografica (Paralleli e Meridiani sottili dorati/azzurri riposanti)
svg += `  <g stroke="rgba(255, 255, 255, 0.2)" stroke-width="1.0" stroke-dasharray="6,6">\n`;
for (let lat = -80; lat <= 80; lat += 20) {
  const [, y] = project(0, lat);
  svg += `    <line x1="0" y1="${y.toFixed(1)}" x2="${WIDTH}" y2="${y.toFixed(1)}" ${lat === 0 ? 'stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-dasharray="none"' : ''}/>\n`;
}
for (let lng = -180; lng < 180; lng += 30) {
  const [x] = project(lng, 0);
  svg += `    <line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${HEIGHT}" ${lng === 0 ? 'stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-dasharray="none"' : ''}/>\n`;
}
svg += `  </g>\n`;

// 3. Paesi con confini netti scuri e colori opachi
svg += `  <g id="countries">\n`;

const textLabels = [];

// Mappatura abbreviazioni concise per Paesi Europei e densamente popolati (zero sovrapposizioni)
const COUNTRY_SHORT_CODES = {
  'Italy': 'IT',
  'France': 'FR',
  'Spain': 'ES',
  'Germany': 'DE',
  'United Kingdom': 'UK',
  'Portugal': 'PT',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Belgium': 'BE',
  'Netherlands': 'NL',
  'Luxembourg': 'LU',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Czechia': 'CZ',
  'Slovakia': 'SK',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Greece': 'GR',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Denmark': 'DK',
  'Ireland': 'IE',
  'Ukraine': 'UA',
  'Croatia': 'HR',
  'Slovenia': 'SI',
  'Serbia': 'RS',
  'Bosnia and Herzegovina': 'BA',
  'Albania': 'AL',
  'North Macedonia': 'MK',
  'Macedonia': 'MK',
  'Montenegro': 'ME',
  'Kosovo': 'XK',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Estonia': 'EE',
  'Belarus': 'BY',
  'Moldova': 'MD',
  'Cyprus': 'CY',
};

data.features.forEach((feature, index) => {
  const props = feature.properties || {};
  let name = props.NAME || props.ADMIN || '';
  const continent = props.CONTINENT || '';
  const mapColorIdx = (props.MAPCOLOR7 || (index % PALETTE.length) + 1) - 1;
  const color = PALETTE[Math.abs(mapColorIdx) % PALETTE.length];

  const geom = feature.geometry;
  if (!geom) return;

  const isMulti = geom.type === 'MultiPolygon';
  const pathData = coordsToSvgPath(geom.coordinates, isMulti);

  if (pathData) {
    // Confini scuri marcati e netti: massima leggibilità dei bordi senza abbagliare
    svg += `    <path d="${pathData}" fill="${color}" stroke="#0b1b2b" stroke-width="1.8" stroke-linejoin="round"/>\n`;
  }

  // In Europa o per paesi mappati, usa la sigla concisa a 2 caratteri (es. IT, FR, ES, DE, UK)
  const isEurope = continent === 'Europe' || COUNTRY_SHORT_CODES[name];
  const displayName = COUNTRY_SHORT_CODES[name] || (isEurope && props.ISO_A2 && props.ISO_A2 !== '-99' ? props.ISO_A2 : name);

  // Baricentro per etichetta
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;
  const rings = isMulti ? geom.coordinates[0] : geom.coordinates;
  if (rings && rings[0]) {
    const ring = rings[0];
    for (let i = 0; i < ring.length; i += Math.max(1, Math.floor(ring.length / 30))) {
      sumLng += ring[i][0];
      sumLat += ring[i][1];
      count++;
    }
    if (count > 0 && displayName) {
      const [lx, ly] = project(sumLng / count, sumLat / count);
      const isBig = props.POP_EST && props.POP_EST > 40000000 && !isEurope;
      textLabels.push({ 
        name: displayName, 
        fullName: name, 
        x: lx, 
        y: ly, 
        isBig, 
        isEurope,
        priority: isEurope ? 10 : 5 
      });
    }
  }
});

svg += `  </g>\n`;

// 4. Paesi con Algoritmo Anti-Collisione (nessuna sovrapposizione)
const placedLabels = [];
const MIN_DISTANCE_PX = 24;

textLabels.sort((a, b) => (b.priority || 0) - (a.priority || 0));

svg += `  <g id="labels" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">\n`;
for (const lbl of textLabels) {
  if (lbl.x > 50 && lbl.x < WIDTH - 50 && lbl.y > 50 && lbl.y < HEIGHT - 50) {
    // Controllo collisione con etichette già piazzate
    const collision = placedLabels.some((p) => {
      const dx = Math.abs(p.x - lbl.x);
      const dy = Math.abs(p.y - lbl.y);
      return dx < MIN_DISTANCE_PX && dy < MIN_DISTANCE_PX;
    });

    if (!collision) {
      placedLabels.push(lbl);
      const fontSize = lbl.isEurope ? 13 : (lbl.isBig ? 18 : 14);
      svg += `    <text x="${lbl.x.toFixed(1)}" y="${lbl.y.toFixed(1)}" font-size="${fontSize}" font-weight="800" fill="#f8fafc" stroke="#0b1b2b" stroke-width="${lbl.isEurope ? 2.6 : 3.5}" paint-order="stroke fill">${lbl.name}</text>\n`;
    }
  }
}
svg += `  </g>\n`;

svg += `</svg>\n`;

fs.writeFileSync(outSvgPath, svg, 'utf8');
console.log('Successfully generated vibrant 4K political map SVG at:', outSvgPath, 'Size:', (svg.length / 1024).toFixed(1), 'KB');

