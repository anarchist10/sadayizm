import Head from 'next/head';

export default function Home() {
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
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        overflow: 'hidden',
        fontFamily: "'Cinzel', serif"
      }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 400,
          letterSpacing: '2px',
          margin: 0
        }}>
          sadayizm
        </h1>
      </div>
    </>
  );
}