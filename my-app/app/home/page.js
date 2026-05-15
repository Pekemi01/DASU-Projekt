import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='app-container'>
        <h1>Homepage</h1>
        <p
        style={{
            fontSize: 18
        }}>
            Welche Aktion möchten Sie ausführen?
            <li>Kriterien - Kriterien einsehen und gewichten</li>
            <li>Maßnahmen - neue Maßnahmen anlegen und bestehende anhand der Kriterien bewerten</li>
            <li>Ranking - die angelegten Maßnahmen miteinander vergleichen</li>
        </p>

        <Link href="/criteria">
            <button className='criteriaButton'>Kriterien</button>
        </Link>

        <Link href="/measure">
            <button className='measureButton'>Maßnahmen</button>
        </Link>

        <Link href="/ranking">
            <button className='rankingButton'>Ranking</button>
        </Link>

        
    </div>

    
  );
}