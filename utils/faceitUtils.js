// Función para resolver automáticamente el nickname de Faceit usando SteamID64
export const resolveFaceitNickname = async (steamID64) => {
  try {
    // Usar faceitfinder.com para resolver el nickname
    const response = await fetch(`https://faceitfinder.com/api/steam/${steamID64}`);
    
    if (!response.ok) {
      throw new Error('No se pudo resolver el nickname');
    }
    
    const data = await response.json();
    
    // La respuesta puede variar según la API, ajustar según sea necesario
    if (data && data.nickname) {
      return data.nickname;
    }
    
    throw new Error('Nickname no encontrado');
  } catch (error) {
    console.error('Error resolviendo nickname de Faceit:', error);
    return null;
  }
};

// Función para obtener datos de ELO de Faceit
export const getFaceitElo = async (nickname) => {
  try {
    const response = await fetch(`https://faceit.lcrypt.eu/?n=${nickname}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener datos de Faceit');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo ELO de Faceit:', error);
    return { elo: 'N/A', diff: 0, level: 'N/A' };
  }
};

// Función combinada para obtener ELO usando SteamID64
export const getFaceitEloBySteamID = async (steamID64) => {
  try {
    const nickname = await resolveFaceitNickname(steamID64);
    
    if (!nickname) {
      return { elo: 'N/A', diff: 0, level: 'N/A', error: 'No se pudo resolver nickname' };
    }
    
    const eloData = await getFaceitElo(nickname);
    return { ...eloData, nickname };
  } catch (error) {
    console.error('Error obteniendo ELO por SteamID:', error);
    return { elo: 'N/A', diff: 0, level: 'N/A', error: error.message };
  }
}; 