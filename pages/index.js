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
            <div key={nick.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a
                className="nick-link"
                href={nick.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {nick.name}
              </a>
              {idx === 0 && (
                <span title="Top ELO" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C7.03 2 3 6.03 3 11C3 13.38 4.19 15.47 6.09 16.74C6.03 17.16 6 17.58 6 18C6 19.1 6.9 20 8 20C8.55 20 9.05 19.78 9.41 19.41C10.23 20.13 11.08 20.5 12 20.5C12.92 20.5 13.77 20.13 14.59 19.41C14.95 19.78 15.45 20 16 20C17.1 20 18 19.1 18 18C18 17.58 17.97 17.16 17.91 16.74C19.81 15.47 21 13.38 21 11C21 6.03 16.97 2 12 2ZM8.5 15C7.67 15 7 14.33 7 13.5C7 12.67 7.67 12 8.5 12C9.33 12 10 12.67 10 13.5C10 14.33 9.33 15 8.5 15ZM15.5 15C14.67 15 14 14.33 14 13.5C14 12.67 14.67 12 15.5 12C16.33 12 17 12.67 17 13.5C17 14.33 16.33 15 15.5 15Z" fill="#fff"/>
                  </svg>
                </span>
              )}
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