import Head from 'next/head';
import Starfield from '../components/Starfield';
import { useEffect, useState, useRef } from 'react';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', faceitApi: 'https://api.jakobkristensen.com/76561198860541170/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/ANARCHlST' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', faceitApi: 'https://api.jakobkristensen.com/76561198402344265/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/nikito' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', faceitApi: 'https://api.jakobkristensen.com/76561198374148982/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/kyrgios' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/', faceitApi: 'https://api.jakobkristensen.com/76561198023120655/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/bendecido' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/', faceitApi: 'https://api.jakobkristensen.com/76561198131602113/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/oilrigplayer' },
  { name: 'Supr3me', url: 'https://steamcommunity.com/id/Supr3me76561198063990435/', faceitApi: 'https://api.jakobkristensen.com/76561198063990435/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/Supr3me' },
  { name: 'daker', url: 'https://steamcommunity.com/id/pierdotodo', faceitApi: 'https://api.jakobkristensen.com/76561199108305712/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/daker' },
  { name: 'ElComba', url: 'https://steamcommunity.com/id/combademon666', faceitApi: 'https://api.jakobkristensen.com/76561199027855096/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/BRBRCOMBAPIM', videoId: 'RMwxJXrgksw' },
  { name: 'Gordoreally', url: 'https://steamcommunity.com/id/lilitacarriooo/', faceitApi: 'https://api.jakobkristensen.com/76561198318387050/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/GordoReally' },
  { name: 'diego2570', url: 'https://steamcommunity.com/id/257O/', faceitApi: 'https://api.jakobkristensen.com/76561198999382443/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/goa1221' },
];

export default function Home() {
  const [elos, setElos] = useState({});
  const [sortedNicks, setSortedNicks] = useState(nicks);
  const [hoveredNick, setHoveredNick] = useState(null);
  const audioRef = useRef(null);
  const startedRef = useRef(false);
  const [backgroundMusicPaused, setBackgroundMusicPaused] = useState(false);

  useEffect(() => {
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

  // Manejar pausa/reanudación de música de fondo
  const handleVideoHover = (isHovering) => {
    if (audioRef.current && startedRef.current) {
      if (isHovering) {
        audioRef.current.pause();
        setBackgroundMusicPaused(true);
      } else {
        audioRef.current.play();
        setBackgroundMusicPaused(false);
      }
    }
  };

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
            <div key={nick.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', position: 'relative' }}>
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
                  onMouseEnter={() => {
                    if (nick.videoId) {
                      setHoveredNick(nick.name);
                      handleVideoHover(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (nick.videoId) {
                      setHoveredNick(null);
                      handleVideoHover(false);
                    }
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
              
              {/* Video tooltip for ElComba */}
              {nick.videoId && hoveredNick === nick.name && (
                <div className="video-tooltip">
                  <iframe
                    width="320"
                    height="180"
                    src={`https://www.youtube.com/embed/${nick.videoId}?autoplay=1&loop=1&playlist=${nick.videoId}`}
                    title="ElComba clip"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}