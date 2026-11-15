// Generatore di Texture Geopolitica Completa ad Alta Risoluzione per il Globo 3D – HAVE2WANT PLUS
// Mappamondo Geopolitico Moderno, Elegante e Leggibile:
// - Oceani blu notte cartografico ad alto contrasto (#09182b)
// - Confini nazionali precisi di tutti i 177 Paesi sovrani (da earth_political.svg)
// - Reticolo di meridiani e paralleli (Equatore, Tropici, Circoli Polari, meridiani ogni 15°)
// - Palette cromatica geopolitica contemporanea ad alta leggibilità

import * as THREE from 'three';

// Funzione di utilità: converte Lat/Lng in coordinate pixel equirettangolari X, Y sul canvas
export function geoToCanvas(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

/**
 * Disegna il reticolo geografico (meridiani e paralleli) sulla mappa geopolitica
 */
function drawGeographicGraticule(ctx: CanvasRenderingContext2D, width: number, height: number) {
  if (typeof ctx.beginPath !== 'function') return;

  if (typeof ctx.save === 'function') {
    ctx.save();
  }
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1.5;
  if (typeof ctx.setLineDash === 'function') {
    ctx.setLineDash([8, 12]);
  }

  // Paralleli standard ogni 15 gradi
  for (let lat = -75; lat <= 75; lat += 15) {
    if (lat === 0) continue;
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Meridiani standard ogni 30 gradi
  for (let lng = -180; lng <= 180; lng += 30) {
    if (lng === 0) continue;
    const x = ((lng + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Linee di riferimento astronomico speciale: Tropici (23.44°) e Circoli Polari (66.56°)
  ctx.strokeStyle = 'rgba(0, 255, 102, 0.22)';
  ctx.lineWidth = 2.0;
  if (typeof ctx.setLineDash === 'function') {
    ctx.setLineDash([12, 12]);
  }

  const tropicoCancroY = ((90 - 23.44) / 180) * height;
  const tropicoCapricornoY = ((90 - (-23.44)) / 180) * height;
  ctx.beginPath();
  ctx.moveTo(0, tropicoCancroY);
  ctx.lineTo(width, tropicoCancroY);
  ctx.moveTo(0, tropicoCapricornoY);
  ctx.lineTo(width, tropicoCapricornoY);
  ctx.stroke();

  // Equatore (0°) e Meridiano Zero (Greenwich)
  ctx.strokeStyle = 'rgba(0, 255, 102, 0.40)';
  ctx.lineWidth = 3.0;
  if (typeof ctx.setLineDash === 'function') {
    ctx.setLineDash([]);
  }
  const equatorY = height / 2;
  ctx.beginPath();
  ctx.moveTo(0, equatorY);
  ctx.lineTo(width, equatorY);
  ctx.stroke();

  const greenwichX = width / 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.beginPath();
  ctx.moveTo(greenwichX, 0);
  ctx.lineTo(greenwichX, height);
  ctx.stroke();

  if (typeof ctx.restore === 'function') {
    ctx.restore();
  }
}

/**
 * Crea una texture geopolitica mondiale cartografica moderna e nitida (4096 x 2048):
 * - Confini vettoriali dei 177 Paesi sovrani
 * - Oceani blu notte profondo
 * - Reticolo cartografico di coordinate
 */
export function createPoliticalGlobeTexture(): THREE.Texture {
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Sfondo oceani: elegante gradiente blu notte cartografico ad alto contrasto
    if (typeof ctx.createLinearGradient === 'function') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#040b14');   // Polo Nord
      grad.addColorStop(0.3, '#081728');
      grad.addColorStop(0.5, '#0a1d33'); // Equatore
      grad.addColorStop(0.7, '#081728');
      grad.addColorStop(1, '#040b14');   // Polo Sud
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#081728';
    }
    ctx.fillRect(0, 0, width, height);

    // Reticolo geografico iniziale
    drawGeographicGraticule(ctx, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (ctx) {
        if (typeof ctx.createLinearGradient === 'function') {
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#040b14');
          grad.addColorStop(0.3, '#081728');
          grad.addColorStop(0.5, '#0a1d33');
          grad.addColorStop(0.7, '#081728');
          grad.addColorStop(1, '#040b14');
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = '#081728';
        }
        ctx.fillRect(0, 0, width, height);

        drawGeographicGraticule(ctx, width, height);

        // Disegna i 177 paesi vettoriali da earth_political.svg
        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(img, 0, 0, width, height);
        }

        drawGeographicGraticule(ctx, width, height);

        texture.needsUpdate = true;
      }
    };
    img.src = '/textures/earth_political.svg';
  }

  return texture;
}
