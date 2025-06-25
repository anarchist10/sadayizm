import Head from 'next/head';
import Starfield from '../components/Starfield';

const nicks = [
  { name: 'anar', url: 'https://steamcommunity.com/id/anrz/' },
  { name: 'angry', url: 'https://steamcommunity.com/id/69qui9uwjr9qjq9124u1925u15/' },
  { name: 'nyoh', url: 'https://steamcommunity.com/id/srz1/' },
  { name: 'rks', url: 'https://steamcommunity.com/id/5t9/' },
  { name: 'nikito', url: 'https://steamcommunity.com/id/nkto/' },
];

export default function Home() {
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