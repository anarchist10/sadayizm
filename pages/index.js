import Head from 'next/head';
import Starfield from '../components/Starfield';
import { useEffect, useState, useRef } from 'react';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', faceitApi: 'https://api.jakobkristensen.com/76561198860541170/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/ANARCHlST', eloDiffApi: 'https://api.jakobkristensen.com/76561198860541170/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', faceitApi: 'https://api.jakobkristensen.com/76561198402344265/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/nikito', eloDiffApi: 'https://api.jakobkristensen.com/76561198402344265/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', faceitApi: 'https://api.jakobkristensen.com/76561198374148982/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/kyrgios', eloDiffApi: 'https://api.jakobkristensen.com/76561198374148982/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/', faceitApi: 'https://api.jakobkristensen.com/76561198023120655/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/bendecido', eloDiffApi: 'https://api.jakobkristensen.com/76561198023120655/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/', faceitApi: 'https://api.jakobkristensen.com/76561198131602113/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/oilrigplayer', eloDiffApi: 'https://api.jakobkristensen.com/76561198131602113/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'Supr3me', url: 'https://steamcommunity.com/id/Supr3me76561198063990435/', faceitApi: 'https://api.jakobkristensen.com/76561198063990435/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/Supr3me', eloDiffApi: 'https://api.jakobkristensen.com/76561198063990435/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'daker', url: 'https://steamcommunity.com/id/pierdotodo', faceitApi: 'https://api.jakobkristensen.com/76561199108305712/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/daker', eloDiffApi: 'https://api.jakobkristensen.com/76561199108305712/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'ElComba', url: 'https://steamcommunity.com/id/combademon666', faceitApi: 'https://api.jakobkristensen.com/76561199027855096/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/BRBRCOMBAPIM', eloDiffApi: 'https://api.jakobkristensen.com/76561199027855096/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'Gordoreally', url: 'https://steamcommunity.com/id/lilitacarriooo/', faceitApi: 'https://api.jakobkristensen.com/76561198318387050/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/GordoReally', eloDiffApi: 'https://api.jakobkristensen.com/76561198318387050/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
  { name: 'diego2570', url: 'https://steamcommunity.com/id/257O/', faceitApi: 'https://api.jakobkristensen.com/76561198999382443/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/goa1221', eloDiffApi: 'https://api.jakobkristensen.com/76561198999382443/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]' },
];

// Componente para la flecha de diferencia de elo
function EloDiffArrow({ diff }) {
  if (diff === 0 || diff === undefined || diff === null) return null;
  
  const isPositive = diff > 0;
  const color = isPositive ? '#00ff00' : '#ff0000';
  const rotation = isPositive ? '0deg' : '180deg';
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.3rem',
      fontSize: '0.9rem',
      color: color
    }}>
      <svg 
        width="12" 
        height="12" 
        viewBox="0 0 24 24" 
        fill={color}
        style={{ transform: `rotate(${rotation})` }}
      >
        <path d="M12 2L22 12H17V22H7V12H2L12 2Z"/>
      </svg>
      <span>{isPositive ? '+' : ''}{diff}</span>
    </div>
  );
}

export default function Home() {
  const [elos, setElos] = useState({});
  const [eloDiffs, setEloDiffs] = useState({});
  const [sortedNicks, setSortedNicks] = useState(nicks);
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Fetch elos actuales
    nicks.forEach(nick => {
      if (nick.faceitApi) {
        fetch(nick.faceitApi)
          .then(res => res.json())
          .then(data => {
            const eloValue = data.elo || data;
            console.log(`${nick.name} raw elo:`, eloValue, typeof eloValue);
            setElos(prev => ({ ...prev, [nick.name]: eloValue }));
          })
          .catch(() => setElos(prev => ({ ...prev, [nick.name]: 'N/A' })));
      }
    });

    // Fetch diferencias de elo del día
    nicks.forEach(nick => {
      if (nick.eloDiffApi) {
        fetch(nick.eloDiffApi)
          .then(res => res.json())
          .then(data => {
            const diffValue = data.todayEloDiff || data;
            console.log(`${nick.name} elo diff:`, diffValue, typeof diffValue);
            setEloDiffs(prev => ({ ...prev, [nick.name]: diffValue }));
          })
          .catch(() => setEloDiffs(prev => ({ ...prev, [nick.name]: 0 })));
      }
    });
  }, []);

  useEffect(() => {
    if (Object.keys(elos).length === nicks.length) {
      const nicksWithElo = nicks.map(nick => {
        const eloValue = elos[nick.name];
        let parsedElo = 0;
        
        if (typeof eloValue === 'number') {
          // La API devuelve el elo en formato de miles (ej: 2.83 = 2830)
          // Solo multiplicar si el valor es mayor a 0
          parsedElo = eloValue > 0 ? Math.round(eloValue * 1000) : 0;
          
          // Si el elo original termina en .0, .10, .20, etc., la API no incluye el 0 final
          // Verificamos si el valor original termina en un múltiplo de 0.01
          const originalValue = eloValue * 1000;
          if (originalValue % 10 === 0 && parsedElo % 10 !== 0) {
            // Si debería terminar en 0 pero no termina, agregamos el 0
            parsedElo = parsedElo * 10;
          }
        } else if (typeof eloValue === 'string') {
          // Remover cualquier caracter no numérico excepto puntos
          const cleanValue = eloValue.replace(/[^\d.]/g, '');
          const floatValue = parseFloat(cleanValue) || 0;
          parsedElo = floatValue > 0 ? Math.round(floatValue * 1000) : 0;
          
          // Si el elo original termina en .0, .10, .20, etc., la API no incluye el 0 final
          const originalValue = floatValue * 1000;
          if (originalValue % 10 === 0 && parsedElo % 10 !== 0) {
            // Si debería terminar en 0 pero no termina, agregamos el 0
            parsedElo = parsedElo * 10;
          }
        }
        
        console.log(`${nick.name} raw: ${eloValue}, parsed: ${parsedElo}`);
        
        return {
          ...nick,
          elo: parsedElo
        };
      });
      nicksWithElo.sort((a, b) => b.elo - a.elo);
      setSortedNicks(nicksWithElo);
    }
  }, [elos]);

  useEffect(() => {
    const handleFirstClick = () => {
      if (!startedRef.current && audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play();
        startedRef.current = true;
      }
    };
    window.addEventListener('click', handleFirstClick);
    return () => {
      window.removeEventListener('click', handleFirstClick);
    };
  }, []);

  return (
    <>
      <Head>
        <title>sadayizm</title>
        <link href="https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap" rel="stylesheet" />
      </Head>
      <Starfield />
      <audio ref={audioRef} src="/sluttysonny.mp3" loop style={{ display: 'none' }} />
      <div className="center-content">
        <div className="gothic-title">sadayizm</div>
        <div className="nick-list">
          {sortedNicks.map((nick, idx) => (
            <div key={nick.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              {idx === 0 && (
                <img src="/corona.png" alt="corona" style={{ width: '100px', marginBottom: '-0.5rem', display: 'block', alignSelf: 'center' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a
                  className="nick-link"
                  href={nick.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'block', 
                    textAlign: 'center',
                    color: idx === 0 ? '#FFD700' : (nick.name === 'angry' ? '#ff0000' : 'inherit'),
                    position: nick.name === 'angry' ? 'relative' : 'static'
                  }}
                >
                  {nick.name}
                  {nick.name === 'angry' && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '0',
                      right: '0',
                      height: '2px',
                      backgroundColor: '#ff0000',
                      transform: 'translateY(1px)'
                    }} />
                  )}
                </a>
                {nick.faceitApi && (
                  <>
                    <span style={{ fontSize: '1.2rem' }}>{elos[nick.name] !== undefined ? elos[nick.name] : '...'}</span>
                    <EloDiffArrow diff={eloDiffs[nick.name]} />
                    <a
                      href={nick.faceitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 28L30 16L2 4L7.5 16L2 28Z" fill="#FF5500"/>
                      </svg>
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}