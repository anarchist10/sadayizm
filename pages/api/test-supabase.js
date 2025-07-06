// Endpoint de diagnóstico para verificar la configuración de Supabase
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  console.log('🔍 === DIAGNÓSTICO DE SUPABASE ===');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      url: {
        exists: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NO CONFIGURADA',
        valid: supabaseUrl && supabaseUrl.includes('supabase.co')
      },
      anonKey: {
        exists: !!supabaseAnonKey,
        value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NO CONFIGURADA',
        valid: supabaseAnonKey && supabaseAnonKey.length > 100
      }
    },
    connection: null,
    table: null
  };
  
  console.log('Variables de entorno:', diagnostics.environment);
  
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Test de conexión básica
      console.log('🔗 Probando conexión...');
      const { data, error } = await supabase
        .from('trolls')
        .select('count')
        .limit(1);
      
      if (error) {
        diagnostics.connection = {
          status: 'ERROR',
          error: error.message,
          code: error.code
        };
        console.error('❌ Error de conexión:', error);
      } else {
        diagnostics.connection = {
          status: 'SUCCESS',
          message: 'Conexión exitosa'
        };
        console.log('✅ Conexión exitosa');
        
        // Test de la tabla trolls
        console.log('📋 Probando tabla trolls...');
        const { data: trollsData, error: trollsError } = await supabase
          .from('trolls')
          .select('*')
          .limit(5);
        
        if (trollsError) {
          diagnostics.table = {
            status: 'ERROR',
            error: trollsError.message,
            code: trollsError.code
          };
          console.error('❌ Error en tabla trolls:', trollsError);
        } else {
          diagnostics.table = {
            status: 'SUCCESS',
            count: trollsData?.length || 0,
            message: 'Tabla accesible'
          };
          console.log('✅ Tabla trolls accesible, registros:', trollsData?.length || 0);
        }
      }
    } catch (error) {
      diagnostics.connection = {
        status: 'CRITICAL_ERROR',
        error: error.message
      };
      console.error('💥 Error crítico:', error);
    }
  } else {
    diagnostics.connection = {
      status: 'NO_CONFIG',
      message: 'Variables de entorno no configuradas'
    };
  }
  
  console.log('📊 Diagnóstico completo:', diagnostics);
  console.log('=== FIN DIAGNÓSTICO ===');
  
  res.status(200).json(diagnostics);
}