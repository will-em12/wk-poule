
const SUPABASE_URL = "https://lgcuepcmhxyctlcppvrg.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_J8mGajDSAcrL7mT4hPfc7A_ELUgg3ql";


import React, { useState, useEffect } from "react";

export default function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [pool, setPool] = useState("");

  const [predictions, setPredictions] = useState({});
  const [realScores, setRealScores] = useState({});
  const [players, setPlayers] = useState([]);
  const [points, setPoints] = useState(0);

  // ✅ WK wedstrijden (basis schema)
  const matches = [
    { id: "1", home: "Nederland", away: "USA" },
    { id: "2", home: "Frankrijk", away: "Brazilië" },
    { id: "3", home: "Spanje", away: "Argentinië" },
    { id: "4", home: "Duitsland", away: "Mexico" }
  ];

  // ✅ LIVE SCORES (mock / later API)
  useEffect(() => {
    setRealScores({
      "1": { home: 2, away: 1 },
      "2": { home: 1, away: 1 },
      "3": { home: 0, away: 2 },
      "4": { home: 3, away: 0 }
    });
  }, []);

  // ✅ score invullen
  const handleScore = (id, team, value) => {
    setPredictions({
      ...predictions,
      [id]: {
        ...(predictions[id] || {}),
        [team]: Number(value)
      }
    });
  };
  const save = async () => {
    await fetch(`${SUPABASE_URL}/rest/v1/poule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        name: name,
        pool: pool,
        predictions: predictions,
        points: points
      })
    });

    alert("✅ Opgeslagen!");
    loadRanking(); // refresh direct
  };

  // ✅ punten berekenen (Toto style)
  const calculatePoints = () => {
    let pts = 0;

    matches.forEach(match => {
      const p = predictions[match.id];
      const r = realScores[match.id];

      if (!p || !r) return;

      // winnaar correct
      if (
        (p.home > p.away && r.home > r.away) ||
        (p.home < p.away && r.home < r.away) ||
        (p.home === p.away && r.home === r.away)
      ) {
        pts += 3;
      }

      // exacte score
      if (p.home === r.home && p.away === r.away) {
        pts += 2;
      }
    });

    setPoints(pts);
  };

  // ✅ opslaan (simpele poule)
  const save = () => {
    calculatePoints();

    setPlayers([
      ...players,
      { name: name, pts: points }
    ]);
  };

  // ✅ LOGIN
  if (!loggedIn) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, purple, blue)"
      }}>
        <div style={{ background: "white", padding: "20px", borderRadius: "10px" }}>
          <h2>⚽ WK Poule</h2>

          <input placeholder="Naam" onChange={(e) => setName(e.target.value)} /><br /><br />
          <input placeholder="Poule (bijv vrienden)" onChange={(e) => setPool(e.target.value)} /><br /><br />

          <button onClick={() => setLoggedIn(true)}>Start</button>
        </div>
      </div>
    );
  }

  // ✅ APP
  const [players, setPlayers] = useState([]);
  return (
    <div style={{ padding: "20px" }}>

      <h1>🏆 WK 2026 Poule</h1>

      {/* ✅ wedstrijden */}
      {matches.map(m => {
        const live = realScores[m.id];

        return (
          <div key={m.id} style={{ marginBottom: "10px" }}>
            {m.home}

            <input
              type="number"
              onChange={(e) => handleScore(m.id, "home", e.target.value)}
              style={{ width: "40px", margin: "0 5px" }}
            />

            -

            <input
              type="number"
              onChange={(e) => handleScore(m.id, "away", e.target.value)}
              style={{ width: "40px", margin: "0 5px" }}
            />

            {m.away}

            {/* ✅ live score */}
            {live && (
              <span style={{ marginLeft: "10px", color: "red" }}>
                🔴 LIVE: {live.home} - {live.away}
              </span>
            )}
          </div>
        );
      })}

      {/* ✅ save */}
      <button onClick={save}>Opslaan</button>

      {/* ✅ jouw punten */}
      <h2>Jouw punten: {points}</h2>

      {/* ✅ ranking */}
      <h2>🏆 Ranking ({pool})</h2>

      {players.map((p, i) => (
        <div key={i}>
          #{i + 1} {p.name} - {p.pts} punten
        </div>
      ))}

      {/* ✅ debug */}
      <pre>{JSON.stringify(predictions, null, 2)}</pre>

    </div>
  );
}