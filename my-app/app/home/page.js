import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
        <h1>Das ist die Homepage</h1>

        <Link href="/ranking">
            <button className='rankingButton'>Ranking</button>
        </Link>

        <Link href="/measure">
            <button className='measureButton'>Maßnahmen</button>
        </Link>

        <Link href="/criteria">
            <button className='criteriaButton'>Kriterien</button>
        </Link>
    </div>

    
  );
}