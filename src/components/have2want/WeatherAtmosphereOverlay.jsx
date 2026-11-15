import React, { useEffect, useRef } from 'react';

/**
 * Overlay Atmosferico Fenomeni Meteo Reali
 * Proietta effetti leggeri, eleganti e non invasivi (pioggia fine, neve soffice, foschia, nuvole alte, lampi soffusi)
 * lasciando la mappa satellitare e gli edifici 3D perfettamente nitidi e visibili al 100%.
 */
export default function WeatherAtmosphereOverlay({ weather, enabled = true }) {
  const canvasRef = useRef(null);
  const animIdRef = useRef(null);

  useEffect(() => {
    if (!enabled || !weather) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const category = weather.condition?.category || 'clear';
    const isRain = category === 'rain' || category === 'drizzle' || category === 'thunderstorm';
    const isSnow = category === 'snow';
    const isThunder = category === 'thunderstorm';
    const isFog = category === 'fog';

    // Se non ci sono precipitazioni o fenomeni attivi, non serve il loop particellare
    if (!isRain && !isSnow && !isFog) {
      ctx.clearRect(0, 0, width, height);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Generazione particelle (delicate e a densità calibrata per non disturbare la visuale 3D)
    const particleCount = isRain ? 110 : isSnow ? 65 : 30;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: isRain ? 9 + Math.random() * 8 : 0.8 + Math.random() * 1.5,
        length: isRain ? 10 + Math.random() * 12 : 2 + Math.random() * 3,
        size: isSnow ? 1.5 + Math.random() * 2.5 : 1,
        opacity: isRain ? 0.12 + Math.random() * 0.18 : 0.2 + Math.random() * 0.25,
        drift: isSnow ? (Math.random() - 0.5) * 0.8 : (weather.windSpeed || 5) * 0.08,
      });
    }

    let lightningTimer = 0;
    let lightningOpacity = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Lampo soffuso occasionale per temporale
      if (isThunder) {
        lightningTimer++;
        if (lightningTimer > 280 && Math.random() < 0.03) {
          lightningOpacity = 0.12; // Molto soffuso per non disturbare
          lightningTimer = 0;
        }
        if (lightningOpacity > 0.005) {
          ctx.fillStyle = `rgba(224, 242, 254, ${lightningOpacity})`;
          ctx.fillRect(0, 0, width, height);
          lightningOpacity *= 0.88;
        }
      }

      // 2. Leggera foschia per nebbia
      if (isFog) {
        const fogGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
        fogGrad.addColorStop(0, 'rgba(203, 213, 225, 0)');
        fogGrad.addColorStop(1, 'rgba(203, 213, 225, 0.09)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Pioggia sottile
      if (isRain) {
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.drift * 2, p.y + p.length);
          ctx.stroke();

          p.y += p.speed;
          p.x += p.drift;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * width;
          }
        }
      }

      // 4. Neve soffice fluttuante
      if (isSnow) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speed;
          p.x += p.drift + Math.sin(p.y * 0.02) * 0.5;

          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        }
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [weather, enabled]);

  if (!enabled || !weather) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
    />
  );
}
