import Link from 'next/link';
import './globals.css'

function Header({ title }) {
    return <h1>{title ? title : "Default title"}</h1>
}

export default function HomePage() {

    return (
        <div className='app-container'>
            <Header title="DASU - Scoring Web App" />

            <div>
                Willkommen in der Web App des DASU-Teamprojekts.
                Hier können die verschiedenen Maßnahmen am Lederhof gegeneinander abgewogen werden.
                Um zu starten, klicken Sie bitte auf "Start".
            </div>

            <Link href="/home">
                <button className="startButton">Start →</button>
            </Link>
        </div>
    );
}

