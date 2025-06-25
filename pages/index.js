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
];

export default function Home() {
  const [elos, setElos] = useState({});
  const [sortedNicks, setSortedNicks] = useState(nicks);
  const [nikitoEloDiff, setNikitoEloDiff] = useState(null);
  const [showNikitoEloDiff, setShowNikitoEloDiff] = useState(false);
  const [anarEloDiff, setAnarEloDiff] = useState(null);
  const [showAnarEloDiff, setShowAnarEloDiff] = useState(false);
  const [supr3meEloDiff, setSupr3meEloDiff] = useState(null);
  const [showSupr3meEloDiff, setShowSupr3meEloDiff] = useState(false);
  const [angryEloDiff, setAngryEloDiff] = useState(null);
  const [showAngryEloDiff, setShowAngryEloDiff] = useState(false);
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    nicks.forEach(nick => {
      if (nick.faceitApi) {
        fetch(nick.faceitApi)
          .then(res => res.json())
          .then(data => {
            setElos(prev => ({ ...prev, [nick.name]: data.elo || data }));
          })
          .catch(() => setElos(prev => ({ ...prev, [nick.name]: 'N/A' })));
      }
    });
    // Obtener elo diff de nikito
    fetch('https://api.jakobkristensen.com/76561198402344265/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]')
      .then(res => res.json())
      .then(data => setNikitoEloDiff(typeof data === 'number' ? data : parseInt(data)))
      .catch(() => setNikitoEloDiff(null));
    setTimeout(() => setShowNikitoEloDiff(true), 3000);
    setTimeout(() => setShowNikitoEloDiff(false), 6000);
    // Obtener elo diff de anar
    fetch('https://api.jakobkristensen.com/76561198860541170/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]')
      .then(res => res.json())
      .then(data => setAnarEloDiff(typeof data === 'number' ? data : parseInt(data)))
      .catch(() => setAnarEloDiff(null));
    setTimeout(() => setShowAnarEloDiff(true), 3000);
    setTimeout(() => setShowAnarEloDiff(false), 6000);
    // Obtener elo diff de supr3me
    fetch('https://api.jakobkristensen.com/76561198063990435/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]')
      .then(res => res.json())
      .then(data => setSupr3meEloDiff(typeof data === 'number' ? data : parseInt(data)))
      .catch(() => setSupr3meEloDiff(null));
    setTimeout(() => setShowSupr3meEloDiff(true), 3000);
    setTimeout(() => setShowSupr3meEloDiff(false), 6000);
    // Obtener elo diff de angry
    fetch('https://api.jakobkristensen.com/76561198131602113/{{todayEloDiff}}[[America/Argentina/Buenos_Aires]]')
      .then(res => res.json())
      .then(data => setAngryEloDiff(typeof data === 'number' ? data : parseInt(data)))
      .catch(() => setAngryEloDiff(null));
    setTimeout(() => setShowAngryEloDiff(true), 3000);
    setTimeout(() => setShowAngryEloDiff(false), 6000);
  }, []);

  useEffect(() => {
    if (Object.keys(elos).length === nicks.length) {
      const nicksWithElo = nicks.map(nick => ({
        ...nick,
        elo: typeof elos[nick.name] === 'number' ? elos[nick.name] : parseInt(elos[nick.name]) || 0
      }));
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
                  style={{ display: 'block', textAlign: 'center' }}
                >
                  {nick.name}
                </a>
                {nick.faceitApi && (
                  <>
                    <span style={{ fontSize: '1.2rem' }}>{elos[nick.name] !== undefined ? elos[nick.name] : '...'}</span>
                    {/* elo diff para nikito */}
                    {nick.name === 'nikito' && nikitoEloDiff !== null && showNikitoEloDiff && (
                      <span
                        style={{
                          color: nikitoEloDiff > 0 ? 'limegreen' : nikitoEloDiff < 0 ? 'red' : 'gray',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.1rem',
                          margin: '0 0.3rem',
                          minWidth: '55px',
                          justifyContent: 'center'
                        }}
                      >
                        {nikitoEloDiff > 0 ? '↑' : nikitoEloDiff < 0 ? '↓' : ''} {nikitoEloDiff > 0 ? '+' : ''}{nikitoEloDiff}
                      </span>
                    )}
                    {/* elo diff para anar */}
                    {nick.name === 'anar' && anarEloDiff !== null && showAnarEloDiff && (
                      <span
                        style={{
                          color: anarEloDiff > 0 ? 'limegreen' : anarEloDiff < 0 ? 'red' : 'gray',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.1rem',
                          margin: '0 0.3rem',
                          minWidth: '55px',
                          justifyContent: 'center'
                        }}
                      >
                        {anarEloDiff > 0 ? '↑' : anarEloDiff < 0 ? '↓' : ''} {anarEloDiff > 0 ? '+' : ''}{anarEloDiff}
                      </span>
                    )}
                    {/* elo diff para supr3me */}
                    {nick.name === 'Supr3me' && supr3meEloDiff !== null && showSupr3meEloDiff && (
                      <span
                        style={{
                          color: supr3meEloDiff > 0 ? 'limegreen' : supr3meEloDiff < 0 ? 'red' : 'gray',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.1rem',
                          margin: '0 0.3rem',
                          minWidth: '55px',
                          justifyContent: 'center'
                        }}
                      >
                        {supr3meEloDiff > 0 ? '↑' : supr3meEloDiff < 0 ? '↓' : ''} {supr3meEloDiff > 0 ? '+' : ''}{supr3meEloDiff}
                      </span>
                    )}
                    {/* elo diff para angry */}
                    {nick.name === 'angry' && angryEloDiff !== null && showAngryEloDiff && (
                      <span
                        style={{
                          color: angryEloDiff > 0 ? 'limegreen' : angryEloDiff < 0 ? 'red' : 'gray',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.1rem',
                          margin: '0 0.3rem',
                          minWidth: '55px',
                          justifyContent: 'center'
                        }}
                      >
                        {angryEloDiff > 0 ? '↑' : angryEloDiff < 0 ? '↓' : ''} {angryEloDiff > 0 ? '+' : ''}{angryEloDiff}
                      </span>
                    )}
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