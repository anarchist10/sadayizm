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

// Función simplificada para parsear ELO
function parseElo(rawElo) {
  console.log('Raw ELO received:', rawElo, typeof rawElo);
  
  // Si es un número, asumimos que está en formato decimal (ej: 2.83 = 2830)
  if (typeof rawElo === 'number') {
    return rawElo > 0 ? Math.round(rawElo * 1000) : 0;
  }
  
  // Si es string, intentamos parsearlo
  if (typeof rawElo === 'string') {
    const cleanValue = rawElo.replace(/[^\d.]/g, '');
    const floatValue = parseFloat(cleanValue);
    return !isNaN(floatValue) && floatValue > 0 ? Math.round(floatValue * 1000) : 0;
  }
  
  return 0;
}

// Función para hacer fetch con retry y timeout
async function fetchEloWithRetry(nick, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching ELO for ${nick.name} (attempt ${attempt})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch(nick.faceitApi, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`${nick.name} API response:`, data);
      
      const eloValue = data.elo !== undefined ? data.elo : data;
      const parsedElo = parseElo(eloValue);
      
      console.log(`${nick.name} - Raw: ${eloValue}, Parsed: ${parsedElo}`);
      return parsedElo;
      
    } catch (error) {
      console.error(`${nick.name} attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`${nick.name} failed after ${maxRetries} attempts`);
        return 'N/A';
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

export default function Home() {
  const [elos, setElos] = useState({});
  const [sortedNicks, setSortedNicks] = useState(nicks);
  const [hoveredNick, setHoveredNick] = useState(null);
  const [loadingElos, setLoadingElos] = useState(true);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [blacklist, setBlacklist] = useState([]);
  const [keySequence, setKeySequence] = useState('');
  const audioRef = useRef(null);
  const startedRef = useRef(false);
  const [backgroundMusicPaused, setBackgroundMusicPaused] = useState(false);

  // Detectar secuencia de teclas "lista"
  useEffect(() => {
    const handleKeyPress = (e) => {
      const newSequence = (keySequence + e.key.toLowerCase()).slice(-5);
      setKeySequence(newSequence);
      
      if (newSequence === 'lista') {
        setShowBlacklist(!showBlacklist);
        setKeySequence(''); // Reset sequence
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [keySequence, showBlacklist]);

  // Cargar blacklist del localStorage
  useEffect(() => {
    const savedBlacklist = localStorage.getItem('sadayizm-blacklist');
    if (savedBlacklist) {
      setBlacklist(JSON.parse(savedBlacklist));
    }
  }, []);

  // Guardar blacklist en localStorage
  const saveBlacklist = (newBlacklist) => {
    setBlacklist(newBlacklist);
    localStorage.setItem('sadayizm-blacklist', JSON.stringify(newBlacklist));
  };

  // Agregar nick a blacklist
  const addToBlacklist = (nickName) => {
    if (!blacklist.includes(nickName)) {
      const newBlacklist = [...blacklist, nickName];
      saveBlacklist(newBlacklist);
    }
  };

  // Remover nick de blacklist
  const removeFromBlacklist = (nickName) => {
    const newBlacklist = blacklist.filter(name => name !== nickName);
    saveBlacklist(newBlacklist);
  };

  // Filtrar nicks según blacklist
  const getVisibleNicks = () => {
    return sortedNicks.filter(nick => !blacklist.includes(nick.name));
  };

  useEffect(() => {
    // Función para cargar ELOs de forma secuencial (evita sobrecargar la API)
    async function loadElos() {
      setLoadingElos(true);
      const eloResults = {};
      
      for (const nick of nicks) {
        if (nick.faceitApi) {
          // Pequeña pausa entre requests para no sobrecargar la API
          if (Object.keys(eloResults).length > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const elo = await fetchEloWithRetry(nick);
          eloResults[nick.name] = elo;
          
          // Actualizar estado inmediatamente para mostrar progreso
          setElos(prev => ({ ...prev, [nick.name]: elo }));
        }
      }
      
      setLoadingElos(false);
      console.log('All ELOs loaded:', eloResults);
    }
    
    loadElos();
  }, []);

  useEffect(() => {
    if (Object.keys(elos).length === nicks.length) {
      const nicksWithElo = nicks.map(nick => ({
        ...nick,
        elo: elos[nick.name] === 'N/A' ? 0 : elos[nick.name]
      }));
      
      // Ordenar: primero por ELO válido (descendente), luego N/A al final
      nicksWithElo.sort((a, b) => {
        if (elos[a.name] === 'N/A' && elos[b.name] !== 'N/A') return 1;
        if (elos[a.name] !== 'N/A' && elos[b.name] === 'N/A') return -1;
        return b.elo - a.elo;
      });
      
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

  const visibleNicks = getVisibleNicks();
  const topNick = visibleNicks[0];

  return (
    <>
      <Head>
        <title>sadayizm</title>
        <link href="https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap" rel="stylesheet" />
      </Head>
      <Starfield />
      <audio ref={audioRef} src="/sluttysonny.mp3" loop style={{ display: 'none' }} />
      
      {/* Blacklist Modal */}
      {showBlacklist && (
        <div className="blacklist-modal">
          <div className="blacklist-content">
            <div className="blacklist-header">
              <h2>🚫 Lista Negra</h2>
              <button 
                className="close-btn"
                onClick={() => setShowBlacklist(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="blacklist-section">
              <h3>Nicks Ocultos ({blacklist.length})</h3>
              {blacklist.length === 0 ? (
                <p className="empty-list">No hay nicks en la lista negra</p>
              ) : (
                <div className="blacklisted-nicks">
                  {blacklist.map(nickName => (
                    <div key={nickName} className="blacklisted-nick">
                      <span>{nickName}</span>
                      <button 
                        className="restore-btn"
                        onClick={() => removeFromBlacklist(nickName)}
                        title="Restaurar nick"
                      >
                        ↩️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="blacklist-section">
              <h3>Nicks Visibles</h3>
              <div className="visible-nicks">
                {nicks.filter(nick => !blacklist.includes(nick.name)).map(nick => (
                  <div key={nick.name} className="visible-nick">
                    <span>{nick.name}</span>
                    <button 
                      className="hide-btn"
                      onClick={() => addToBlacklist(nick.name)}
                      title="Ocultar nick"
                    >
                      🚫
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="center-content">
        <div className="gothic-title">sadayizm</div>
        {loadingElos && (
          <div style={{ color: '#ffd700', fontSize: '1rem', marginBottom: '1rem' }}>
            Cargando ELOs...
          </div>
        )}
        <div className="nick-list">
          {visibleNicks.map((nick, idx) => (
            <div key={nick.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', position: 'relative' }}>
              {idx === 0 && elos[nick.name] !== 'N/A' && elos[nick.name] > 0 && (
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
                    color: idx === 0 && elos[nick.name] !== 'N/A' && elos[nick.name] > 0 ? '#FFD700' : (nick.name === 'angry' ? '#ff0000' : 'inherit'),
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
                    <span style={{ 
                      fontSize: '1.2rem',
                      color: elos[nick.name] === 'N/A' ? '#ff6b6b' : 'inherit'
                    }}>
                      {elos[nick.name] !== undefined ? elos[nick.name] : '...'}
                    </span>
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