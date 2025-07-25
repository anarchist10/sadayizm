import Head from 'next/head';
import Starfield from '../components/Starfield';
import { useEffect, useState, useRef } from 'react';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/', faceitApi: 'https://api.jakobkristensen.com/76561198860541170/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/ANARCHlST' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/', faceitApi: 'https://api.jakobkristensen.com/76561198402344265/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/nikito' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/', faceitApi: 'https://api.jakobkristensen.com/76561198374148982/{{elo}}[[America/Argentina/Buenos_Aires]]', faceitUrl: 'https://www.faceit.com/es/players/nyohSOSA' },
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

// Función optimizada para hacer fetch con retry y timeout más corto
async function fetchEloWithRetry(nick, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching ELO for ${nick.name} (attempt ${attempt})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Reducido a 5 segundos
      
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
      
      // Esperar menos tiempo antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
}

// Función para generar URL de Steam correcta
function generateSteamUrl(steamId, steamId64) {
  // Si steamId ya es una URL completa, usarla directamente
  if (steamId && steamId.startsWith('http')) {
    return steamId;
  }
  
  // Si tenemos steamId64, usar formato de profiles
  if (steamId64 && steamId64 !== 'No especificado' && steamId64 !== 'No resuelto' && steamId64.length === 17) {
    return `https://steamcommunity.com/profiles/${steamId64}`;
  }
  
  // Si steamId parece ser un ID numérico, usar formato de profiles
  if (steamId && /^\d+$/.test(steamId)) {
    return `https://steamcommunity.com/profiles/${steamId}`;
  }
  
  // Si no, asumir que es un custom ID y usar formato /id/
  return `https://steamcommunity.com/id/${steamId || 'unknown'}`;
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
  const [newTroll, setNewTroll] = useState({ nick: '', steamId: '', steamId64: '', reason: '', faceitUrl: '' });
  const [loadingTrolls, setLoadingTrolls] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [showTools, setShowTools] = useState(false);
  const [editingTroll, setEditingTroll] = useState(null);
  const [addingTroll, setAddingTroll] = useState(false); // Nuevo estado para loading del botón
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
      console.log('🔄 Cargando lista de trolls...');
      const response = await fetch('/api/trolls', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Datos recibidos:', data);
        setTrollList(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('❌ Error loading troll list:', response.status, response.statusText, errorText);
        setTrollList([]);
        alert(`Error al cargar la lista: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Error loading troll list:', error);
      setTrollList([]);
      alert(`Error de conexión: ${error.message}`);
    }
    setLoadingTrolls(false);
  };

  // Agregar troll a la base de datos
  const addTroll = async () => {
    if (newTroll.nick.trim() && newTroll.steamId.trim()) {
      setAddingTroll(true);
      const troll = {
        nick: newTroll.nick.trim(),
        steamId: newTroll.steamId.trim(),
        steamId64: newTroll.steamId64.trim() || 'No especificado',
        reason: newTroll.reason.trim() || 'Sin razón especificada',
        faceitUrl: newTroll.faceitUrl.trim() || ''
      };
      
      try {
        console.log('📤 Enviando troll:', troll);
        const response = await fetch('/api/trolls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(troll),
        });

        console.log('📡 Respuesta del servidor:', response.status, response.statusText);

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Respuesta exitosa:', responseData);
          setTrollList(prev => [...prev, responseData]);
          setNewTroll({ nick: '', steamId: '', steamId64: '', reason: '', faceitUrl: '' });
          console.log('🎉 Troll agregado exitosamente');
        } else {
          const errorText = await response.text();
          console.error('❌ Error adding troll:', response.status, response.statusText, errorText);
          alert(`Error al agregar el troll: ${response.status} ${response.statusText}\n${errorText}`);
        }
      } catch (error) {
        console.error('💥 Error adding troll:', error);
        alert(`Error de conexión: ${error.message}`);
      } finally {
        setAddingTroll(false);
      }
    }
  };

  // Editar troll existente
  const updateTroll = async () => {
    if (editingTroll && editingTroll.nick.trim() && editingTroll.steam_id.trim()) {
      try {
        const response = await fetch(`/api/trolls?id=${editingTroll.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nick: editingTroll.nick.trim(),
            steamId: editingTroll.steam_id.trim(),
            steamId64: editingTroll.steam_id64.trim() || 'No especificado',
            reason: editingTroll.reason.trim() || 'Sin razón especificada',
            faceitUrl: editingTroll.faceit_url.trim() || ''
          }),
        });

        if (response.ok) {
          const updatedTroll = await response.json();
          setTrollList(prev => prev.map(troll => 
            troll.id === editingTroll.id ? updatedTroll : troll
          ));
          setEditingTroll(null);
        } else {
          const errorText = await response.text();
          console.error('Error updating troll:', response.statusText, errorText);
          alert(`Error al actualizar el troll: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error updating troll:', error);
        alert('Error de conexión. Inténtalo de nuevo.');
      }
    }
  };

  // Remover troll de la base de datos
  const removeTroll = async (trollId) => {
    console.log('🗑️ Frontend: Intentando eliminar troll con ID:', trollId, 'tipo:', typeof trollId);
    
    if (!confirm('¿Estás seguro de que quieres eliminar este troll?')) {
      return;
    }
    
    try {
      console.log('🗑️ Eliminando troll con ID:', trollId);
      const response = await fetch(`/api/trolls?id=${trollId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Troll eliminado exitosamente');
        setTrollList(prev => prev.filter(troll => troll.id !== trollId));
      } else {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        alert(`Error al eliminar el troll: ${response.status} ${response.statusText}\nDetalles: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error removing troll:', error);
      alert('Error de conexión. Inténtalo de nuevo.');
    }
  };

  // Función para mostrar herramientas y seleccionar pestaña
  const showToolsWithTab = (tabName) => {
    setShowTools(true);
    setActiveTab(tabName);
  };

  // Iniciar edición de un troll
  const startEditTroll = (troll) => {
    setEditingTroll({ ...troll });
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingTroll(null);
  };

  useEffect(() => {
    // Función optimizada para cargar ELOs con carga paralela limitada
    async function loadElos() {
      setLoadingElos(true);
      const eloResults = {};
      
      // Procesar en lotes de 3 para no sobrecargar la API
      const batchSize = 3;
      const nicksWithApi = nicks.filter(nick => nick.faceitApi);
      
      for (let i = 0; i < nicksWithApi.length; i += batchSize) {
        const batch = nicksWithApi.slice(i, i + batchSize);
        
        // Procesar el lote en paralelo
        const batchPromises = batch.map(async (nick) => {
          const elo = await fetchEloWithRetry(nick);
          return { name: nick.name, elo };
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Actualizar estado con los resultados del lote
        batchResults.forEach(({ name, elo }) => {
          eloResults[name] = elo;
          setElos(prev => ({ ...prev, [name]: elo }));
        });
        
        // Pequeña pausa entre lotes
        if (i + batchSize < nicksWithApi.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      setLoadingElos(false);
      console.log('All ELOs loaded:', eloResults);
    }
    
    loadElos();
  }, []);

  useEffect(() => {
    if (Object.keys(elos).length === nicks.filter(n => n.faceitApi).length) {
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
          <div className="troll-content-with-tools">
            <div className="troll-header">
              <h2>🚨 Lista de Trolls/Tóxicos</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowTrollList(false);
                  setShowTools(false);
                  setActiveTab(null);
                  setEditingTroll(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="troll-main-layout">
              {/* Panel izquierdo - Lista de trolls */}
              <div className="troll-left-panel">
                {/* Formulario para agregar nuevo troll */}
                <div className="add-troll-section">
                  <h3>{editingTroll ? '✏️ Editar Troll' : '➕ Agregar Troll'}</h3>
                  <div className="troll-form">
                    <input
                      type="text"
                      placeholder="Nick del troll"
                      value={editingTroll ? editingTroll.nick : newTroll.nick}
                      onChange={(e) => editingTroll 
                        ? setEditingTroll({...editingTroll, nick: e.target.value})
                        : setNewTroll({...newTroll, nick: e.target.value})
                      }
                      className="troll-input"
                    />
                    <input
                      type="text"
                      placeholder="Steam ID o URL de Steam"
                      value={editingTroll ? editingTroll.steam_id : newTroll.steamId}
                      onChange={(e) => editingTroll 
                        ? setEditingTroll({...editingTroll, steam_id: e.target.value})
                        : setNewTroll({...newTroll, steamId: e.target.value})
                      }
                      className="troll-input"
                    />
                    <input
                      type="text"
                      placeholder="Steam ID64 (opcional - búscalo en las herramientas →)"
                      value={editingTroll ? editingTroll.steam_id64 : newTroll.steamId64}
                      onChange={(e) => editingTroll 
                        ? setEditingTroll({...editingTroll, steam_id64: e.target.value})
                        : setNewTroll({...newTroll, steamId64: e.target.value})
                      }
                      className="troll-input"
                    />
                    <input
                      type="text"
                      placeholder="URL de Faceit (opcional - búscalo en las herramientas →)"
                      value={editingTroll ? editingTroll.faceit_url : newTroll.faceitUrl}
                      onChange={(e) => editingTroll 
                        ? setEditingTroll({...editingTroll, faceit_url: e.target.value})
                        : setNewTroll({...newTroll, faceitUrl: e.target.value})
                      }
                      className="troll-input"
                    />
                    <input
                      type="text"
                      placeholder="Razón (opcional)"
                      value={editingTroll ? editingTroll.reason : newTroll.reason}
                      onChange={(e) => editingTroll 
                        ? setEditingTroll({...editingTroll, reason: e.target.value})
                        : setNewTroll({...newTroll, reason: e.target.value})
                      }
                      className="troll-input"
                    />
                    <div className="form-buttons">
                      {editingTroll ? (
                        <>
                          <button 
                            className="add-troll-btn update-btn"
                            onClick={updateTroll}
                            disabled={!editingTroll.nick.trim() || !editingTroll.steam_id.trim()}
                          >
                            💾 Guardar Cambios
                          </button>
                          <button 
                            className="add-troll-btn cancel-btn"
                            onClick={cancelEdit}
                          >
                            ❌ Cancelar
                          </button>
                        </>
                      ) : (
                        <button 
                          className="add-troll-btn"
                          onClick={addTroll}
                          disabled={!newTroll.nick.trim() || !newTroll.steamId.trim() || addingTroll}
                        >
                          {addingTroll ? '⏳ Agregando...' : 'Agregar Troll'}
                        </button>
                      )}
                    </div>
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
                        <div key={troll.id} className={`troll-item ${editingTroll && editingTroll.id === troll.id ? 'editing' : ''}`}>
                          <div className="troll-info">
                            <div className="troll-nick">{troll.nick}</div>
                            <div className="troll-details">
                              <div className="troll-steamid">
                                <strong>Steam ID:</strong> {troll.steam_id}
                              </div>
                              {troll.steam_id64 && troll.steam_id64 !== 'No especificado' && troll.steam_id64 !== 'No resuelto' && (
                                <div className="troll-steamid64">
                                  <strong>Steam ID64:</strong> {troll.steam_id64}
                                </div>
                              )}
                              {troll.faceit_url && troll.faceit_url !== '' && (
                                <div className="troll-faceit-url">
                                  <strong>Faceit:</strong> <a href={troll.faceit_url} target="_blank" rel="noopener noreferrer" className="faceit-link">{troll.faceit_url}</a>
                                </div>
                              )}
                              <div className="troll-date">
                                <strong>Agregado:</strong> {new Date(troll.date_added).toLocaleDateString('es-AR')}
                              </div>
                            </div>
                            <div className="troll-reason">"{troll.reason}"</div>
                          </div>
                          <div className="troll-actions">
                            <a
                              href={generateSteamUrl(troll.steam_id, troll.steam_id64)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="steam-btn"
                              title="Ver perfil en Steam"
                            >
                              <img 
                                src="/steam-1-logo-png-transparent.png" 
                                alt="Steam" 
                                width="20" 
                                height="20" 
                                style={{ objectFit: 'contain' }}
                              />
                            </a>
                            <a
                              href={`https://faceitfinder.com/profile/${troll.steam_id64 || troll.steam_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="faceit-finder-btn"
                              title="Buscar en FaceitFinder"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#88ccff"/>
                              </svg>
                            </a>
                            {troll.faceit_url && troll.faceit_url !== '' && (
                              <a
                                href={troll.faceit_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="faceit-profile-btn"
                                title="Ver perfil en Faceit"
                              >
                                <img 
                                  src="/faceitlogo.png" 
                                  alt="Faceit" 
                                  width="20" 
                                  height="20" 
                                  style={{ objectFit: 'contain' }}
                                />
                              </a>
                            )}
                            <button 
                              className="edit-troll-btn"
                              onClick={() => startEditTroll(troll)}
                              title="Editar troll"
                              disabled={editingTroll !== null}
                            >
                              ✏️
                            </button>
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

              {/* Panel derecho - Herramientas */}
              <div className="tools-panel">
                <div className="tools-header">
                  <h3>🔧 Herramientas de Búsqueda</h3>
                  <p>Busca Steam ID64 y información de Faceit</p>
                </div>
                
                {/* Botones para mostrar herramientas */}
                {!showTools ? (
                  <div className="tools-buttons">
                    <button 
                      className="tool-launch-btn faceit-btn"
                      onClick={() => showToolsWithTab('faceitfinder')}
                    >
                      🎯 Abrir FaceitFinder
                    </button>
                    <button 
                      className="tool-launch-btn steamid-btn"
                      onClick={() => showToolsWithTab('steamid')}
                    >
                      🔍 Abrir SteamID.io
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Pestañas */}
                    <div className="tabs-container">
                      <button 
                        className={`tab-button ${activeTab === 'faceitfinder' ? 'active' : ''}`}
                        onClick={() => setActiveTab('faceitfinder')}
                      >
                        🎯 FaceitFinder
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'steamid' ? 'active' : ''}`}
                        onClick={() => setActiveTab('steamid')}
                      >
                        🔍 SteamID.io
                      </button>
                      <button 
                        className="tab-button close-tools"
                        onClick={() => {
                          setShowTools(false);
                          setActiveTab(null);
                        }}
                      >
                        ✕ Cerrar
                      </button>
                    </div>

                    {/* Contenido de las pestañas */}
                    <div className="tab-content">
                      {activeTab === 'faceitfinder' && (
                        <div className="tool-container">
                          <div className="tool-instructions">
                            <p>🎯 <strong>FaceitFinder:</strong> Busca perfiles de Faceit usando Steam ID</p>
                          </div>
                          <iframe
                            src="https://faceitfinder.com/"
                            title="FaceitFinder"
                            className="tool-iframe"
                            frameBorder="0"
                            allowFullScreen
                          />
                        </div>
                      )}
                      
                      {activeTab === 'steamid' && (
                        <div className="tool-container">
                          <div className="tool-instructions">
                            <p>🔍 <strong>SteamID.io:</strong> Convierte URLs de Steam a Steam ID64</p>
                          </div>
                          <iframe
                            src="https://steamid.io/"
                            title="SteamID.io"
                            className="tool-iframe"
                            frameBorder="0"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="center-content">
        <div className="gothic-title">sadayizm</div>
        {loadingElos && (
          <div style={{ color: '#ffd700', fontSize: '1rem', marginBottom: '1rem' }}>
            Cargando ELOs... ({Object.keys(elos).length}/{nicks.filter(n => n.faceitApi).length})
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
                      <img 
                        src="/faceitlogo.png" 
                        alt="Faceit" 
                        width="20" 
                        height="20" 
                        style={{ objectFit: 'contain' }}
                      />
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
