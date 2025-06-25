import Head from 'next/head';
import Starfield from '../components/Starfield';
import { useEffect, useState } from 'react';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/' },
];

export default function Home() {
  const [elo, setElo] = useState(null);

  useEffect(() => {
    // Llamada a la API para obtener el ELO de Faceit de 'anar'
    fetch('https://api.jakobkristensen.com/76561198860541170/{{elo}}[[America/Argentina/Buenos_Aires]]')
      .then(res => res.json())
      .then(data => {
        // Suponiendo que el ELO viene como un número directamente
        setElo(data.elo || data);
      })
      .catch(() => setElo('N/A'));
  }, []);

  return (
    <>
      <Head>
        <title>sadayizm</title>
        <link href="https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap" rel="stylesheet" />
      </Head>
      <Starfield />
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
              {nick.name === 'anar' && (
                <>
                  <span style={{ fontSize: '1.2rem' }}>{elo !== null ? elo : '...'}</span>
                  <a
                    href="https://www.faceit.com/es/players/ANARCHlST"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {/* Icono Faceit SVG */}
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