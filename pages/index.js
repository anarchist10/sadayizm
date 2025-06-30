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

// Función para resolver Steam ID64 desde custom URL usando Steam Web API
async function resolveSteamId64FromCustomUrl(customUrl) {
  try {
    console.log(`🔍 Intentando resolver Steam ID64 para custom URL: ${customUrl}`);
    
    // Primero intentar buscar en nuestros usuarios conocidos
    const knownUser = nicks.find(nick => {
      const urlMatch = nick.url.match(/steamcommunity\.com\/id\/([^\/\s]+)/);
      return urlMatch && urlMatch[1] === customUrl;
    });
    
    if (knownUser && knownUser.faceitApi) {
      const steamId64Match = knownUser.faceitApi.match(/\b(7656119\d{10})\b/);
      if (steamId64Match) {
        console.log(`✅ Steam ID64 encontrado en usuarios conocidos: ${steamId64Match[1]}`);
        return steamId64Match[1];
      }
    }
    
    // Si no se encuentra en usuarios conocidos, intentar con métodos alternativos
    console.log(`⚠️ No se encontró Steam ID64 para ${customUrl} en usuarios conocidos`);
    
    // Aquí podrías implementar otros métodos como:
    // - Steam Web API (requiere API key)
    // - Scraping de la página de Steam
    // - Base de datos local de conversiones conocidas
    
    return null;
  } catch (error) {
    console.error('Error resolviendo Steam ID64:', error);
    return null;
  }
}

// Función mejorada para extraer Steam ID de URL o texto
async function extractSteamId(input) {
  if (!input) return { steamId: '', steamId64: '' };
  
  const cleanInput = input.trim();
  
  // Si ya es un Steam ID64 (17 dígitos)
  if (/^7656119\d{10}$/.test(cleanInput)) {
    return { 
      steamId: cleanInput, 
      steamId64: cleanInput 
    };
  }
  
  // Buscar Steam ID64 en URLs o texto
  const steamId64Match = cleanInput.match(/\b(7656119\d{10})\b/);
  if (steamId64Match) {
    return { 
      steamId: steamId64Match[1], 
      steamId64: steamId64Match[1] 
    };
  }
  
  // Buscar custom URL en Steam URLs
  const customUrlMatch = cleanInput.match(/steamcommunity\.com\/id\/([^\/\s]+)/);
  if (customUrlMatch) {
    const customUrl = customUrlMatch[1];
    const resolvedSteamId64 = await resolveSteamId64FromCustomUrl(customUrl);
    
    return {
      steamId: customUrl,
      steamId64: resolvedSteamId64 || 'No resuelto'
    };
  }
  
  // Buscar profile URL
  const profileMatch = cleanInput.match(/steamcommunity\.com\/profiles\/(\d+)/);
  if (profileMatch) {
    const steamId64 = profileMatch[1];
    return { 
      steamId: steamId64, 
      steamId64: steamId64 
    };
  }
  
  // Si no encuentra nada específico, intentar resolver como custom URL
  const cleanCustomUrl = cleanInput.replace(/[^\w\d]/g, '');
  if (cleanCustomUrl.length >= 3) {
    const resolvedSteamId64 = await resolveSteamId64FromCustomUrl(cleanCustomUrl);
    
    return {
      steamId: cleanCustomUrl,
      steamId64: resolvedSteamId64 || 'No resuelto'
    };
  }
  
  return { steamId: cleanInput, steamId64: 'No válido' };
}

// Función para generar URL de Steam
function generateSteamUrl(steamId) {
  if (!steamId) return '#';
  
  // Si es Steam ID64 (17 dígitos), usar URL de profile
  if (/^7656119\d{10}$/.test(steamId)) {
    return `https://steamcommunity.com/profiles/${steamId}`;
  }
  
  // Si es custom URL, usar URL de id
  return `https://steamcommunity.com/id/${steamId}`;
}

// Función para generar URL de FaceitFinder
function generateFaceitFinderUrl(steamId, steamId64) {
  // Preferir Steam ID64 si está disponible
  if (steamId64 && /^7656119\d{10}$/.test(steamId64)) {
    return `https://faceitfinder.com/profile/${steamId64}`;
  }
  
  if (!steamId) return '#';
  
  // FaceitFinder funciona mejor con Steam ID64
  if (/^7656119\d{10}$/.test(steamId)) {
    return `https://faceitfinder.com/profile/${steamId}`;
  }
  
  // Para custom URLs, intentar buscar por nombre
  return `https://faceitfinder.com/search/${steamId}`;
}

// Función para determinar si un Steam ID es válido
function isValidSteamId(steamIdInfo) {
  if (!steamIdInfo || !steamIdInfo.steamId) return false;
  
  const { steamId, steamId64 } = steamIdInfo;
  
  // Steam ID64 válido (debe empezar con 7656119 y tener 17 dígitos)
  if (/^7656119\d{10}$/.test(steamId)) {
    return true;
  }
  
  // Si tenemos un Steam ID64 resuelto válido
  if (steamId64 && /^7656119\d{10}$/.test(steamId64)) {
    return true;
  }
  
  // Custom URL válido (letras, números, guiones, entre 3-32 caracteres)
  if (/^[a-zA-Z0-9_-]{3,32}$/.test(steamId)) {
    return true;
  }
  
  return false;
}

// Función mejorada para obtener información de Faceit con múltiples métodos
async function fetchFaceitInfo(steamId64) {
  console.log(`🔍 Buscando información de Faceit para Steam ID64: ${steamId64}`);
  
  // Solo proceder si tenemos un Steam ID64 válido
  if (!steamId64 || !/^7656119\d{10}$/.test(steamId64)) {
    console.log('❌ Steam ID64 no válido para búsqueda de Faceit');
    return null;
  }
  
  // Método 1: FaceitFinder API
  try {
    console.log('📡 Intentando con FaceitFinder API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`https://faceitfinder.com/api/lookup?id=${steamId64}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ FaceitFinder response:', data);
      
      if (data && (data.nickname || data.faceit_nickname || data.username)) {
        const nickname = data.nickname || data.faceit_nickname || data.username;
        return {
          nickname: nickname,
          faceitUrl: `https://faceit.com/en/players/${nickname}`,
          method: 'FaceitFinder API'
        };
      }
    }
  } catch (error) {
    console.log('❌ FaceitFinder API falló:', error.message);
  }
  
  // Método 2: Intentar con una API alternativa (simulada)
  try {
    console.log('📡 Intentando con método alternativo...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Intentar con una API proxy o alternativa
    const proxyResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://faceitfinder.com/api/lookup?id=${steamId64}`)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      if (proxyData.contents) {
        const data = JSON.parse(proxyData.contents);
        console.log('✅ Proxy response:', data);
        
        if (data && (data.nickname || data.faceit_nickname || data.username)) {
          const nickname = data.nickname || data.faceit_nickname || data.username;
          return {
            nickname: nickname,
            faceitUrl: `https://faceit.com/en/players/${nickname}`,
            method: 'Proxy API'
          };
        }
      }
    }
  } catch (error) {
    console.log('❌ Método alternativo falló:', error.message);
  }
  
  // Método 3: Buscar en base a patrones conocidos o sugerencias
  console.log('🤔 Intentando con patrones conocidos...');
  
  // Si el Steam ID64 coincide con alguno de nuestros usuarios conocidos
  const knownUser = nicks.find(nick => {
    if (nick.faceitApi) {
      const knownSteamId64Match = nick.faceitApi.match(/\b(7656119\d{10})\b/);
      return knownSteamId64Match && knownSteamId64Match[1] === steamId64;
    }
    return false;
  });
  
  if (knownUser && knownUser.faceitUrl) {
    const faceitNickMatch = knownUser.faceitUrl.match(/players\/([^\/\?]+)/);
    if (faceitNickMatch) {
      console.log('✅ Encontrado en usuarios conocidos:', faceitNickMatch[1]);
      return {
        nickname: faceitNickMatch[1],
        faceitUrl: knownUser.faceitUrl,
        method: 'Usuarios conocidos'
      };
    }
  }
  
  console.log('❌ No se pudo obtener información de Faceit');
  return null;
}

export default function Home() {
  const [elos, setElos] = useState({});
  const [sortedNicks, setSortedNicks] = useState(nicks);
  const [hoveredNick, setHoveredNick] = useState(null);
  const [loadingElos, setLoadingElos] = useState(true);
  const [showTrollList, setShowTrollList] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [trollList, setTrollList] = useState([]);
  const [keySequence, setKeySequence] = useState('');
  const [newTroll, setNewTroll] = useState({ nick: '', steamId: '', reason: '' });
  const [loadingTrolls, setLoadingTrolls] = useState(false);
  const [resolvingFaceit, setResolvingFaceit] = useState(false);
  const [faceitStatus, setFaceitStatus] = useState('');
  const audioRef = useRef(null);
  const startedRef = useRef(false);
  const [backgroundMusicPaused, setBackgroundMusicPaused] = useState(false);

  // Detectar secuencia de teclas "lista"
  useEffect(() => {
    const handleKeyPress = (e) => {
      const newSequence = (keySequence + e.key.toLowerCase()).slice(-5);
      setKeySequence(newSequence);
      
      if (newSequence === 'lista') {
        setShowPasswordPrompt(true);
        setKeySequence(''); // Reset sequence
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [keySequence]);

  // Manejar verificación de contraseña
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '21') {
      setShowPasswordPrompt(false);
      setShowTrollList(true);
      setPassword('');
      setPasswordError('');
      loadTrollList();
    } else {
      setPasswordError('Contraseña incorrecta');
      setPassword('');
    }
  };

  // Cargar lista de trolls desde la API
  const loadTrollList = async () => {
    setLoadingTrolls(true);
    try {
      const response = await fetch('/api/trolls');
      if (response.ok) {
        const data = await response.json();
        setTrollList(data);
      } else {
        console.error('Error loading troll list:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading troll list:', error);
    }
    setLoadingTrolls(false);
  };

  // Agregar troll a la base de datos
  const addTroll = async () => {
    if (newTroll.nick.trim() && newTroll.steamId.trim()) {
      setResolvingFaceit(true);
      setFaceitStatus('🔍 Validando y resolviendo Steam ID...');
      
      const steamIdInfo = await extractSteamId(newTroll.steamId.trim());
      
      if (!isValidSteamId(steamIdInfo)) {
        alert('Steam ID no válido. Debe ser un Steam ID64 (17 dígitos) o un nombre de usuario válido.');
        setResolvingFaceit(false);
        setFaceitStatus('');
        return;
      }
      
      setFaceitStatus('🔍 Buscando información de Faceit...');
      
      // Obtener información de Faceit usando el Steam ID64 si está disponible
      const steamId64ForFaceit = steamIdInfo.steamId64 && /^7656119\d{10}$/.test(steamIdInfo.steamId64) 
        ? steamIdInfo.steamId64 
        : (steamIdInfo.steamId && /^7656119\d{10}$/.test(steamIdInfo.steamId) ? steamIdInfo.steamId : null);
      
      const faceitInfo = steamId64ForFaceit ? await fetchFaceitInfo(steamId64ForFaceit) : null;
      
      if (faceitInfo) {
        setFaceitStatus(`✅ Encontrado: ${faceitInfo.nickname} (${faceitInfo.method})`);
      } else {
        setFaceitStatus('⚠️ No se encontró información de Faceit');
      }
      
      const troll = {
        nick: newTroll.nick.trim(),
        steamId: steamIdInfo.steamId,
        steamId64: steamIdInfo.steamId64,
        reason: newTroll.reason.trim() || 'Sin razón especificada',
        steamUrl: generateSteamUrl(steamIdInfo.steamId),
        faceitFinderUrl: generateFaceitFinderUrl(steamIdInfo.steamId, steamIdInfo.steamId64),
        faceitNickname: faceitInfo?.nickname || 'No encontrado',
        faceitUrl: faceitInfo?.faceitUrl || '#'
      };
      
      try {
        const response = await fetch('/api/trolls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(troll),
        });

        if (response.ok) {
          const newTrollData = await response.json();
          setTrollList(prev => [...prev, newTrollData]);
          setNewTroll({ nick: '', steamId: '', reason: '' });
          setFaceitStatus('✅ Troll agregado exitosamente');
          
          // Limpiar el status después de 3 segundos
          setTimeout(() => setFaceitStatus(''), 3000);
        } else {
          console.error('Error adding troll:', response.statusText);
          alert('Error al agregar el troll. Inténtalo de nuevo.');
          setFaceitStatus('❌ Error al agregar');
        }
      } catch (error) {
        console.error('Error adding troll:', error);
        alert('Error de conexión. Inténtalo de nuevo.');
        setFaceitStatus('❌ Error de conexión');
      }
      
      setResolvingFaceit(false);
    }
  };

  // Remover troll de la base de datos
  const removeTroll = async (trollId) => {
    try {
      const response = await fetch(`/api/trolls?id=${trollId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrollList(prev => prev.filter(troll => troll.id !== trollId));
      } else {
        console.error('Error removing troll:', response.statusText);
        alert('Error al eliminar el troll. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error removing troll:', error);
      alert('Error de conexión. Inténtalo de nuevo.');
    }
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

  return (
    <>
      <Head>
        <title>sadayizm</title>
        <link href="https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap" rel="stylesheet" />
      </Head>
      <Starfield />
      <audio ref={audioRef} src="/sluttysonny.mp3" loop style={{ display: 'none' }} />
      
      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="password-modal">
          <div className="password-content">
            <h2>🔒 Acceso Restringido</h2>
            <p>Ingresa la contraseña para acceder a la lista:</p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="password-input"
                autoFocus
              />
              {passwordError && (
                <div className="password-error">{passwordError}</div>
              )}
              <div className="password-buttons">
                <button type="submit" className="password-submit">
                  Acceder
                </button>
                <button 
                  type="button" 
                  className="password-cancel"
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setPassword('');
                    setPasswordError('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Troll List Modal */}
      {showTrollList && (
        <div className="troll-modal">
          <div className="troll-content">
            <div className="troll-header">
              <h2>🚨 Lista de Trolls/Tóxicos</h2>
              <button 
                className="close-btn"
                onClick={() => setShowTrollList(false)}
              >
                ✕
              </button>
            </div>
            
            {/* Formulario para agregar nuevo troll */}
            <div className="add-troll-section">
              <h3>➕ Agregar Troll</h3>
              <div className="troll-form">
                <input
                  type="text"
                  placeholder="Nick del troll"
                  value={newTroll.nick}
                  onChange={(e) => setNewTroll({...newTroll, nick: e.target.value})}
                  className="troll-input"
                />
                <input
                  type="text"
                  placeholder="Steam ID64 o URL de Steam completa"
                  value={newTroll.steamId}
                  onChange={(e) => setNewTroll({...newTroll, steamId: e.target.value})}
                  className="troll-input"
                />
                <input
                  type="text"
                  placeholder="Razón (opcional)"
                  value={newTroll.reason}
                  onChange={(e) => setNewTroll({...newTroll, reason: e.target.value})}
                  className="troll-input"
                />
                <div className="steam-id-help">
                  💡 <strong>Tip:</strong> Puedes pegar la URL completa de Steam o solo el Steam ID64. 
                  Se intentará resolver automáticamente el Steam ID64 y el nickname de Faceit usando múltiples métodos.
                </div>
                
                {/* Status de resolución de Faceit */}
                {faceitStatus && (
                  <div className="faceit-status">
                    {faceitStatus}
                  </div>
                )}
                
                <button 
                  className="add-troll-btn"
                  onClick={addTroll}
                  disabled={!newTroll.nick.trim() || !newTroll.steamId.trim() || resolvingFaceit}
                >
                  {resolvingFaceit ? '🔍 Procesando...' : 'Agregar Troll'}
                </button>
              </div>
            </div>

            {/* Lista de trolls */}
            <div className="troll-list-section">
              <h3>📋 Trolls Registrados ({trollList.length})</h3>
              {loadingTrolls ? (
                <div className="loading-trolls">Cargando lista...</div>
              ) : trollList.length === 0 ? (
                <p className="empty-list">No hay trolls registrados</p>
              ) : (
                <div className="troll-list">
                  {trollList.map(troll => (
                    <div key={troll.id} className="troll-item">
                      <div className="troll-info">
                        <div className="troll-nick">{troll.nick}</div>
                        <div className="troll-details">
                          <div className="troll-steamid">
                            <strong>Steam ID:</strong> {troll.steamId}
                          </div>
                          {troll.steamId64 && troll.steamId64 !== 'No resuelto' && troll.steamId64 !== 'No válido' && (
                            <div className="troll-steamid64">
                              <strong>Steam ID64:</strong> {troll.steamId64}
                            </div>
                          )}
                          <div className="troll-faceit-nick">
                            <strong>Faceit:</strong> {troll.faceitNickname || 'No encontrado'}
                          </div>
                          <div className="troll-date">
                            <strong>Agregado:</strong> {new Date(troll.dateAdded).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                        <div className="troll-reason">"{troll.reason}"</div>
                      </div>
                      <div className="troll-actions">
                        <a
                          href={troll.steamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="steam-btn"
                          title="Ver perfil en Steam"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#1b2838"/>
                          </svg>
                        </a>
                        {troll.faceitUrl && troll.faceitUrl !== '#' && troll.faceitNickname !== 'No encontrado' && (
                          <a
                            href={troll.faceitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="faceit-btn"
                            title="Ver perfil en Faceit"
                          >
                            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 28L30 16L2 4L7.5 16L2 28Z" fill="#FF5500"/>
                            </svg>
                          </a>
                        )}
                        <a
                          href={troll.faceitFinderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="faceit-finder-btn"
                          title="Buscar en FaceitFinder"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#88ccff"/>
                          </svg>
                        </a>
                        <button 
                          className="remove-troll-btn"
                          onClick={() => removeTroll(troll.id)}
                          title="Eliminar de la lista"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          {sortedNicks.map((nick, idx) => (
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