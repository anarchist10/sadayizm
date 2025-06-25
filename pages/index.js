import Head from 'next/head';
import { useState, useEffect } from 'react';
import Starfield from '../components/Starfield';
import { getFaceitEloBySteamID } from '../utils/faceitUtils';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', faceitNick: 'ANARCHlST', steamID64: '76561198860541170' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/', faceitNick: 'oilrigplayer', steamID64: '76561198131602113' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', faceitNick: 'kyrgios', steamID64: '76561198374148982' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/', faceitNick: 'bendecido', steamID64: '76561198023120655' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', faceitNick: 'nikito', steamID64: '76561198402344265' },
];

export default function Home() {
  const [faceitData, setFaceitData] = useState({});
  const [loading, setLoading] = useState(true);
  const [useAutoResolve, setUseAutoResolve] = useState(false);

  useEffect(() => {
    const fetchFaceitData = async () => {
      const data = {};
      
      for (const nick of nicks) {
        try {
          let result;
          
          if (useAutoResolve) {
            // Usar resolución automática por SteamID64
            result = await getFaceitEloBySteamID(nick.steamID64);
          } else {
            // Usar nickname manual
            const response = await fetch(`https://faceit.lcrypt.eu/?n=${nick.faceitNick}`);
            result = await response.json();
          }
          
          data[nick.name] = result;
        } catch (error) {
          console.error(`Error fetching data for ${nick.name}:`, error);
          data[nick.name] = { elo: 'N/A', diff: 0 };
        }
      }
      
      setFaceitData(data);
      setLoading(false);
    };

    fetchFaceitData();
  }, [useAutoResolve]);

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
        
        {/* Sección de ELO de Faceit */}
        <div className="faceit-section">
          <div className="faceit-header">
            <h2 className="faceit-title">Faceit ELO</h2>
            <button 
              className="resolve-toggle"
              onClick={() => setUseAutoResolve(!useAutoResolve)}
            >
              {useAutoResolve ? 'Usar Nicknames Manuales' : 'Usar Resolución Automática'}
            </button>
          </div>
          <div className="faceit-list">
            {loading ? (
              <div className="loading">Cargando datos de Faceit...</div>
            ) : (
              nicks.map(nick => {
                const data = faceitData[nick.name] || {};
                return (
                  <div key={nick.name} className="faceit-item">
                    <span className="faceit-name">{nick.name}</span>
                    <span className="faceit-elo">
                      - Elo: {data.elo || 'N/A'} 
                      <span 
                        className="faceit-diff"
                        style={{ color: getDiffColor(data.diff) }}
                      >
                        {' '}( {formatDiff(data.diff)} )
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="nick-list">
          {nicks.map(nick => (
            <a
              key={nick.name}
              className="nick-link"
              href={nick.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {nick.name}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}