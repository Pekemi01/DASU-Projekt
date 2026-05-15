import Link from 'next/link';

export default function KriterienPage() {
  // --- Daten ---
    const criteria = [
    { id: 1, name: "Sauberkeit", gewicht: "0"},
    { id: 2, name: "Sicherheit", gewicht: "0" },
    { id: 3, name: "Soziale Akzeptanz", gewicht: "0" },
    { id: 4, name: "Nachhaltigkeit", gewicht: "0" },
    { id: 5, name: "Kosten", gewicht: "0" }
    ];
    
  return (
    <div className="app-container">
      {/* Homescreen Button*/}
      <Link href="/home">
          <button>← Zurück zur Homepage</button>
      </Link>
  
      <h1>Kriterien</h1>
      <p
      style={{
          fontSize: 18
      }}>
          Hier können Sie die Kriterien einsehen und gewichten.
      </p>

      <div className="list">
        {criteria.map((eintrag, idx) => (
          <div className="row" key={idx}>
            <span className="name">
              {eintrag.name}
            </span>

            <span className="gewicht">
              Aktuelle Gewichtung in %: {eintrag.gewicht}
            </span>
          </div>
        ))}
      </div>

      <Link href="criteria/weighting">
        <button
        style={{
          border: "none",
          background: "none",
          fontSize: 18,
          paddingTop: 20
        }}
        >
          ⚖️ Kriterien neu gewichten</button>
      </Link>
            
    </div>
  )
}