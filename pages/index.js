import Head from 'next/head';
import Starfield from '../components/Starfield';
import { useEffect, useState, useRef } from 'react';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', faceitApi: 'https://api.jakobkristensen.com/76561198860541170/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/ANARCHlST', steamId: '76561198860541170' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', faceitApi: 'https://api.jakobkristensen.com/76561198402344265/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/nikito' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', faceitApi: 'https://api.jakobkristensen.com/76561198374148982/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/kyrgios' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/', faceitApi: 'https://api.jakobkristensen.com/76561198023120655/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/bendecido' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/', faceitApi: 'https://api.jakobkristensen.com/76561198131602113/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/oilrigplayer' },
  { name: 'Supr3me', url: 'https://steamcommunity.com/id/Supr3me76561198063990435/', faceitApi: 'https://api.jakobkristensen.com/76561198063990435/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/Supr3me' },
  { name: 'daker', url: 'https://steamcommunity.com/id/pierdotodo', faceitApi: 'https://api.jakobkristensen.com/76561198999108305712/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/daker' },
  { name: 'ElComba', url: 'https://steamcommunity.com/id/combademon666', faceitApi: 'https://api.jakobkristensen.com/76561199027855096/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/BRBRCOMBAPIM' },
  { name: 'Gordoreally', url: 'https://steamcommunity.com/id/lilitacarriooo/', faceitApi: 'https://api.jakobkristensen.com/76561198318387050/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/GordoReally' },
  { name: 'diego2570', url: 'https://steamcommunity.com/id/257O/', faceitApi: 'https://api.jakobkristensen.com/76561198999382443/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/goa1221' },
];

export default function Home() {
  const [elos, setElos] = useState({});
  const [sortedNicks, setSortedNicks] = useState(nicks);
  const [showAnarCard, setShowAnarCard] = useState(false);
  const [anarAvatar, setAnarAvatar] = useState('');
  const audioRef = useRef(null);
  const startedRef = useRef(false);

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

    // Obtener avatar de Steam para anar
    const anarNick = nicks.find(nick => nick.name === 'anar');
    if (anarNick && anarNick.steamId) {
      // Usar un proxy CORS o una API alternativa para obtener el avatar
      // Como alternativa, podemos usar la URL directa del perfil de Steam
      fetch(`https://steamcommunity.com/profiles/${anarNick.steamId}?xml=1`)
        .then(res => res.text())
        .then(xmlText => {
          // Parsear el XML para obtener la URL del avatar
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          const avatarFull = xmlDoc.querySelector('avatarFull');
          if (avatarFull) {
            setAnarAvatar(avatarFull.textContent);
          }
        })
        .catch(() => {
          // Fallback: usar una URL construida manualmente
          setAnarAvatar(`https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/${anarNick.steamId.slice(-2)}/${anarNick.steamId}_full.jpg`);
        });
    }
  }, []);

  useEffect(() => {
    if (Object.keys(elos).length === nicks.length) {
      const nicksWithElo = nicks.map(nick => {
        const eloValue = elos[nick.name];
        let parsedElo = 0;
        
        if (typeof eloValue === 'number') {
          parsedElo = eloValue > 0 ? Math.round(eloValue * 1000) : 0;
          const originalValue = eloValue * 1000;
          if (originalValue % 10 === 0 && parsedElo % 10 !== 0) {
            parsedElo = parsedElo * 10;
          }
        } else if (typeof eloValue === 'string') {
          const cleanValue = eloValue.replace(/[^\d.]/g, '');
          const floatValue = parseFloat(cleanValue) || 0;
          parsedElo = floatValue > 0 ? Math.round(floatValue * 1000) : 0;
          const originalValue = floatValue * 1000;
          if (originalValue % 10 === 0 && parsedElo % 10 !== 0) {
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
                  onMouseEnter={() => nick.name === 'anar' && setShowAnarCard(true)}
                  onMouseLeave={() => nick.name === 'anar' && setShowAnarCard(false)}
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
              
              {/* Tarjeta hover para anar */}
              {nick.name === 'anar' && showAnarCard && (
                <div className="anar-hover-card">
                  <img 
                    src={anarAvatar || `https://avatars.steamstatic.com/${nick.steamId.slice(-2)}/${nick.steamId}_full.jpg`}
                    alt="anar avatar"
                    style={{ width: '100px', height: '100px', borderRadius: '8px' }}
                    onError={(e) => {
                      // Múltiples fallbacks
                      if (e.target.src.includes('steamstatic')) {
                        e.target.src = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/${nick.steamId.slice(-2)}/${nick.steamId}_full.jpg`;
                      } else if (e.target.src.includes('steamcdn-a')) {
                        e.target.src = `https://steamuserimages-a.akamaihd.net/ugc/${nick.steamId}/${nick.steamId}_full.jpg`;
                      } else {
                        // Último fallback: avatar por defecto de Steam
                        e.target.src = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                      }
                    }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#ccc' }}>
                    Steam Profile
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}