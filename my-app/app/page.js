import Link from 'next/link';
import './globals.css'

function Header({ title }) {
    return <h1>{title ? title : "Default title"}</h1>
}

export default function HomePage() {

    return (
        <div>
            <Header title="DASU - Scoring Web App" />

            <text>
                <li>Willkommen in der Web App des DASU-Teamprojekts.</li>
                <li>Hier können die verschiedenen Maßnahmen am Lederhof gegeneinander abgewogen werden.</li>
                <li>Um zu starten, klicken Sie bitte auf "Start".</li>
            </text>

            <Link href="/home">
                <button className="startButton">Start</button>
            </Link>
        </div>
    );
}

