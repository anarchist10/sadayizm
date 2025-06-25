import Head from 'next/head';
import { useState, useEffect } from 'react';
import Starfield from '../components/Starfield';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', faceitNick: 'ANARCHlST' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/', faceitNick: 'oilrigplayer' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', faceitNick: 'kyrgios' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/', faceitNick: 'bendecido' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', faceitNick: 'nikito' },
];

export default function Home() {
  const [faceitData, setFaceitData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchFaceitData = async () => {
    const data = {};
    
    for (const nick of nicks) {
      try {
        const response = await fetch(`https://faceit.lcrypt.eu/?n=${nick.faceitNick}`);
        const result = await response.json();
        data[nick.name] = result;
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

  const getDiffColor = (diff) => {
    if (diff > 0) return '#00ff00'; // Verde para positivo
    if (diff < 0) return '#ff0000'; // Rojo para negativo
    return '#ffffff'; // Blanco para cero
  };

  const formatDiff = (diff) => {
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '0';
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
              <div key={nick.name} className="nick-container">
                <a
                  className="nick-link"
                  href={nick.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {nick.name}
                </a>
                <span className="elo-display">
                  [Elo: {data.elo || 'N/A'} 
                  <span 
                    className="elo-diff"
                    style={{ color: getDiffColor(data.diff) }}
                  >
                    {' '}({formatDiff(data.diff)})
                  </span>]
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}