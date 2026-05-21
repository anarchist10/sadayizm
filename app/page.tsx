'use client';

import { useState } from 'react';
import { supabase } from './supabase';

export default function Home() {
  const [estadoSolicitud, setEstadoSolicitud] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);

  // Esto simula que un amigo tuyo intenta entrar con su Steam
  const simularLoginSteam = async () => {
    setCargando(true);
    
    // Inventamos datos de prueba (cuando ande Steam, estos datos vendrán de Valve)
    const usuarioPrueba = {
      steam_id: "76561198000000000", // Un ID de Steam inventado
      nombre: "AmigoGamer_Prueba",   // Nombre simulado
      avatar: "https://placekitten.com/100/100" // Foto temporal
    };

    try {
      // 1. Insertamos al usuario en la base de datos de Supabase
      const { data, error } = await supabase
        .from('usuarios_club')
        .upsert([
          { 
            steam_id: usuarioPrueba.steam_id, 
            nombre: usuarioPrueba.nombre, 
            avatar: usuarioPrueba.avatar
            // El estado por defecto en la base de datos ya es 'pendiente'
          }
        ], { onConflict: 'steam_id' })
        .select();

      if (error) throw error;

      // 2. Avisamos en la pantalla el estado actual
      setEstadoSolicitud('pendiente');
    } catch (err) {
      console.error(err);
      alert('Error al conectar con la base de datos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <link 
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&display=swap" 
        rel="stylesheet" 
      />
      
      <div style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        overflow: 'hidden',
        fontFamily: "'Cinzel', serif"
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 400, letterSpacing: '2px', margin: '0 0 20px 0' }}>
          SADAYIZM
        </h1>

        {/* Si no ha intentado loguearse, muestra el botón */}
        {estadoSolicitud === '' && (
          <button 
            onClick={simularLoginSteam}
            disabled={cargando}
            style={{
              backgroundColor: '#10b981', // Verde estilo Steam / CS
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1rem',
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              transition: '0.3s'
            }}
          >
            {cargando ? 'Conectando...' : 'Iniciar Sesión con Steam (Simulado)'}
          </button>
        )}

        {/* Si la solicitud fue enviada y está pendiente */}
        {estadoSolicitud === 'pendiente' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 1s' }}>
            <p style={{ fontSize: '1.2rem', color: '#f59e0b' }}>⚠️ SOLICITUD PENDIENTE</p>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', fontFamily: 'sans-serif' }}>
              Tu cuenta ha sido registrada. Un administrador debe aprobarte para ingresar al club.
            </p>
          </div>
        )}
      </div>
    </>
  );
}