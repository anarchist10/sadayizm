import Head from 'next/head';
import Starfield from '../components/Starfield';
import { useEffect, useState, useRef } from 'react';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', faceitApi: 'https://api.jakobkristensen.com/76561198860541170/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/ANARCHlST' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/', faceitApi: 'https://api.jakobkristensen.com/76561198131602113/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/oilrigplayer' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', faceitApi: 'https://api.jakobkristensen.com/76561198374148982/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/kyrgios' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/', faceitApi: 'https://api.jakobkristensen.com/76561198023120655/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/bendecido' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', faceitApi: 'https://api.jakobkristensen.com/76561198402344265/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/nikito' },
];

export default function Home() {
  const [elos, setElos] = useState({});
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
  }, []);

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
          {nicks.map(nick => (
            <div key={nick.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a
                className="nick-link"
                href={nick.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {nick.name}
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
          ))}
        </div>
      </div>
    </>
  );
}