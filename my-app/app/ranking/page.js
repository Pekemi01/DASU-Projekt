import Link from 'next/link';

export default function RankingPage() {
  return (
    <div className='app-container'>

      {/* Homescreen Button*/}
      <Link href="/home">
          <button>← Zurück zur Homepage</button>
      </Link>
      
      <h1>Ranking</h1>
    </div>

    
  );
}