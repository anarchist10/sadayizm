import fs from 'fs';
import path from 'path';

// Crear directorio de datos si no existe
const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'trolls.json');
const lockPath = path.join(dataDir, 'trolls.lock');

// Función para crear un lock simple
function acquireLock() {
  try {
    if (fs.existsSync(lockPath)) {
      // Verificar si el lock es muy viejo (más de 30 segundos)
      const lockStats = fs.statSync(lockPath);
      const lockAge = Date.now() - lockStats.mtime.getTime();
      if (lockAge > 30000) {
        console.log('🔓 Removiendo lock viejo');
        fs.unlinkSync(lockPath);
      } else {
        return false; // Lock activo
      }
    }
    fs.writeFileSync(lockPath, process.pid.toString());
    return true;
  } catch (error) {
    console.warn('⚠️ Error adquiriendo lock:', error.message);
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  } catch (error) {
    console.warn('⚠️ Error liberando lock:', error.message);
  }
}

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
    console.log('📁 Directorio de datos creado:', dataDir);
  } catch (error) {
    console.error('❌ Error creando directorio de datos:', error);
  }
}

// Función para leer la base de datos JSON
function readDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      console.log('📄 Creando archivo de base de datos JSON');
      const initialData = { trolls: [], lastId: 0 };
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    
    // Validar estructura
    if (!parsed.trolls || !Array.isArray(parsed.trolls)) {
      console.log('🔧 Reparando estructura de base de datos');
      return { trolls: [], lastId: 0 };
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Error leyendo base de datos:', error);
    // Si hay error, crear nueva base de datos
    const initialData = { trolls: [], lastId: 0 };
    try {
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    } catch (writeError) {
      console.error('❌ Error creando nueva base de datos:', writeError);
    }
    return initialData;
  }
}

// Función para escribir la base de datos JSON
function writeDatabase(data) {
  const lockAcquired = acquireLock();
  if (!lockAcquired) {
    console.warn('⚠️ No se pudo adquirir lock para escribir, reintentando...');
    // Esperar un poco y reintentar
    setTimeout(() => {
      writeDatabase(data);
    }, 100);
    return;
  }

  try {
    // Escribir a un archivo temporal primero
    const tempPath = dbPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    
    // Verificar que el archivo temporal se escribió correctamente
    const tempStats = fs.statSync(tempPath);
    if (tempStats.size > 0) {
      // Mover el archivo temporal al archivo final (operación atómica)
      fs.renameSync(tempPath, dbPath);
      console.log('💾 Base de datos JSON guardada');
    } else {
      console.error('❌ Error: archivo temporal vacío');
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  } catch (error) {
    console.error('❌ Error escribiendo base de datos:', error);
    // Limpiar archivo temporal si existe
    const tempPath = dbPath + '.tmp';
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupError) {
        console.error('❌ Error limpiando archivo temporal:', cleanupError);
      }
    }
  } finally {
    releaseLock();
  }
}

// Funciones para manejar trolls
export const trollsDB = {
  // Inicializar la base de datos
  async init() {
    try {
      console.log('🔧 Inicializando base de datos JSON...');
      readDatabase(); // Esto creará el archivo si no existe
      console.log('✅ Base de datos JSON inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando base de datos JSON:', error);
      throw error;
    }
  },

  // Obtener todos los trolls
  async getAll() {
    try {
      const data = readDatabase();
      console.log('📋 Obtenidos', data.trolls.length, 'trolls de la base de datos JSON');
      return data.trolls.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
    } catch (error) {
      console.error('❌ Error obteniendo trolls:', error);
      return [];
    }
  },

  // Agregar un nuevo troll
  async add(troll) {
    try {
      const data = readDatabase();
      const newId = data.lastId + 1;
      
      const newTroll = {
        id: newId,
        nick: troll.nick,
        steam_id: troll.steamId,
        steam_id64: troll.steamId64 || 'No resuelto',
        reason: troll.reason || 'Sin razón especificada',
        faceit_url: troll.faceitUrl || '',
        date_added: new Date().toISOString(),
        last_modified: new Date().toISOString()
      };
      
      data.trolls.push(newTroll);
      data.lastId = newId;
      
      writeDatabase(data);
      
      console.log('✅ Troll agregado exitosamente:', newTroll);
      return newTroll;
    } catch (error) {
      console.error('❌ Error agregando troll:', error);
      throw error;
    }
  },

  // Actualizar un troll existente
  async update(id, troll) {
    try {
      const data = readDatabase();
      const trollIndex = data.trolls.findIndex(t => t.id == id);
      
      if (trollIndex === -1) {
        console.log('❌ Troll no encontrado con ID:', id);
        return null;
      }
      
      const updatedTroll = {
        ...data.trolls[trollIndex],
        nick: troll.nick,
        steam_id: troll.steamId,
        steam_id64: troll.steamId64 || 'No resuelto',
        reason: troll.reason || 'Sin razón especificada',
        faceit_url: troll.faceitUrl || '',
        last_modified: new Date().toISOString()
      };
      
      data.trolls[trollIndex] = updatedTroll;
      writeDatabase(data);
      
      console.log('✅ Troll actualizado exitosamente:', updatedTroll);
      return updatedTroll;
    } catch (error) {
      console.error('❌ Error actualizando troll:', error);
      throw error;
    }
  },

  // Eliminar un troll
  async delete(id) {
    try {
      const data = readDatabase();
      const trollIndex = data.trolls.findIndex(t => t.id == id);
      
      if (trollIndex === -1) {
        console.log('❌ Troll no encontrado con ID:', id);
        return false;
      }
      
      data.trolls.splice(trollIndex, 1);
      writeDatabase(data);
      
      console.log('✅ Troll eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando troll:', error);
      throw error;
    }
  },

  // Obtener un troll por ID
  async getById(id) {
    try {
      const data = readDatabase();
      const troll = data.trolls.find(t => t.id == id);
      return troll || null;
    } catch (error) {
      console.error('❌ Error obteniendo troll por ID:', error);
      return null;
    }
  },

  // Buscar trolls por nick o steam_id
  async search(query) {
    try {
      const data = readDatabase();
      const searchTerm = query.toLowerCase();
      const results = data.trolls.filter(troll => 
        troll.nick.toLowerCase().includes(searchTerm) || 
        troll.steam_id.toLowerCase().includes(searchTerm)
      );
      return results.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
    } catch (error) {
      console.error('❌ Error buscando trolls:', error);
      return [];
    }
  }
};

// Limpiar locks al cerrar el proceso
process.on('exit', () => {
  releaseLock();
});

process.on('SIGINT', () => {
  releaseLock();
  process.exit(0);
});

process.on('SIGTERM', () => {
  releaseLock();
  process.exit(0);
});