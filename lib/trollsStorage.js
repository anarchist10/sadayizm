import fs from 'fs';
import path from 'path';

const TROLLS_FILE = path.join(process.cwd(), 'data', 'trolls.json');

// Asegurar que el directorio existe
function ensureDataDir() {
  const dataDir = path.dirname(TROLLS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Leer trolls del archivo
function readTrolls() {
  ensureDataDir();
  
  if (!fs.existsSync(TROLLS_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(TROLLS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo trolls:', error);
    return [];
  }
}

// Guardar trolls al archivo
function saveTrolls(trolls) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(TROLLS_FILE, JSON.stringify(trolls, null, 2));
    return true;
  } catch (error) {
    console.error('Error guardando trolls:', error);
    return false;
  }
}

// Generar ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export const trollsStorage = {
  // Obtener todos los trolls
  getAll() {
    return readTrolls();
  },

  // Agregar nuevo troll
  add(trollData) {
    const trolls = readTrolls();
    const newTroll = {
      id: generateId(),
      nick: trollData.nick,
      steam_id: trollData.steamId,
      steam_id64: trollData.steamId64 || 'No resuelto',
      reason: trollData.reason || 'Sin razón especificada',
      faceit_url: trollData.faceitUrl || '',
      date_added: new Date().toISOString()
    };
    
    trolls.push(newTroll);
    
    if (saveTrolls(trolls)) {
      return newTroll;
    }
    return null;
  },

  // Actualizar troll
  update(id, trollData) {
    const trolls = readTrolls();
    const index = trolls.findIndex(t => t.id === id);
    
    if (index === -1) {
      return null;
    }
    
    trolls[index] = {
      ...trolls[index],
      nick: trollData.nick,
      steam_id: trollData.steamId,
      steam_id64: trollData.steamId64 || 'No resuelto',
      reason: trollData.reason || 'Sin razón especificada',
      faceit_url: trollData.faceitUrl || '',
      last_modified: new Date().toISOString()
    };
    
    if (saveTrolls(trolls)) {
      return trolls[index];
    }
    return null;
  },

  // Eliminar troll
  delete(id) {
    const trolls = readTrolls();
    const filteredTrolls = trolls.filter(t => t.id !== id);
    
    if (filteredTrolls.length === trolls.length) {
      return false; // No se encontró el troll
    }
    
    return saveTrolls(filteredTrolls);
  }
};