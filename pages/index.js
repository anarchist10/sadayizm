import Head from 'next/head';
import { useState, useEffect } from 'react';
import Starfield from '../components/Starfield';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', steamID: '76561198860541170' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/', steamID: '76561198131602113' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', steamID: '76561198374148982' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/', steamID: '76561198023120655' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', steamID: '76561198402344265' },
];

export default function Home() {
  const [faceitData, setFaceitData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchFaceitData = async () => {
    const data = {};
    
    for (const nick of nicks) {
      try {
        const response = await fetch(`https://api.jakobkristensen.com/${nick.steamID}/{{elo}}%20[[America/Argentina/Buenos_Aires]]`);
        const eloText = await response.text();
        
        // Extraer el ELO del texto (asumiendo que viene como "1234 ELO")
        const eloMatch = eloText.match(/(\d+)/);
        const elo = eloMatch ? eloMatch[1] : 'N/A';
        
        // Obtener el cambio diario
        const diffResponse = await fetch(`https://api.jakobkristensen.com/${nick.steamID}/{{todayEloDiff}}%20[[America/Argentina/Buenos_Aires]]`);
        const diffText = await diffResponse.text();
        
        // Extraer el cambio diario
        const diffMatch = diffText.match(/([+-]?\d+)/);
        const diff = diffMatch ? parseInt(diffMatch[1]) : 0;
        
        data[nick.name] = { elo, diff };
      } catch (error) {
        console.error(`Error fetching data for ${nick.name}:`, error);
        data[nick.name] = { elo: 'N/A', diff: 0 };
      }
    }
    
    setFaceitData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFaceitData();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchFaceitData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getArrow = (diff) => {
    if (diff > 0) return '↑';
    if (diff < 0) return '↓';
    return '';
  };

  const getArrowColor = (diff) => {
    if (diff > 0) return '#00ff00'; // Verde para positivo
    if (diff < 0) return '#ff0000'; // Rojo para negativo
    return '#ffffff'; // Blanco para cero
  };

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
          {nicks.map(nick => {
            const data = faceitData[nick.name] || {};
            return (
              <div key={nick.name} className="nick-row">
                <a
                  className="nick-link"
                  href={nick.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {nick.name}
                </a>
                <span className="elo-text">
                  {data.elo !== 'N/A' && (
                    <>
                      {data.elo}
                      {data.diff !== 0 && (
                        <span 
                          className="elo-arrow"
                          style={{ color: getArrowColor(data.diff) }}
                        >
                          {' '}{getArrow(data.diff)}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}