import React, { useState, useEffect } from "react";

const SUPABASE_URL = "https://lgcuepcmhxyctlcppvrg.supabase.co";
const SUPABASE_KEY = "sb_publishable_J8mGajDSAcrL7mT4hPfc7A_ELUgg3ql";

const API_URL = "https://api.football-data.org/v4/matches";
const API_KEY = "JOUW_API_KEY_HIER"; // 👈 zet jouw key

export default function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [pool, setPool] = useState("");

  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [realScores, setRealScores] = useState({});
  const [players, setPlayers] = useState([]);
  const [points, setPoints] = useState(0);

  // ✅ API ophalen
  const fetchLive = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: {
          "X-Auth-Token": API_KEY
        }
      });

      const data = await res.json();

      const wkMatches = data.matches
        .slice(0, 5); // pak gewoon eerste 5

      const scoreMap = {};
      const matchList = [];

      wkMatches.forEach(m => {
        scoreMap[m.id] = {
          home: m.score.fullTime.home ?? 0,
          away: m.score.fullTime.away ?? 0
        };

        matchList.push({
          id: m.id,
          home: m.homeTeam.name,
          away: m.awayTeam.name
        });
      });

      setRealScores(scoreMap);
      setMatches(matchList);

    } catch (err) {
      console.log("API error", err);
    }
  };

  // ✅ refresh elke 30 sec
  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ FIXED INPUT
  const handleScore = (id, team, value) => {
    setPredictions((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [team]: Number(value)
      }
    }));
  };

  // ✅ punten
  const calculatePoints = () => {
    let pts = 0;

    matches.forEach(m => {
      const p = predictions[m.id];
      const r = realScores[m.id];

      if (!p || !r) return;

      if (
        (p.home > p.away && r.home > r.away) ||
        (p.home < p.away && r.home < r.away) ||
        (p.home === p.away && r.home === r.away)
      ) {
        pts += 3;
      }

      if (p.home === r.home && p.away === r.away) {
        pts += 2;
      }
    });

    setPoints(pts);
    return pts;
  };

  // ✅ load ranking
  const loadRanking = async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/poule?pool=eq.${pool}&select=*`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await res.json();
    setPlayers(data);
  };

  // ✅ save
  const save = async () => {
    const pts = calculatePoints();

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
        points: pts
      })
    });

    alert("✅ Opgeslagen!");
    loadRanking();
  };

  // ✅ login
  const login = () => {
    if (!name || !pool) {
      alert("Vul alles in");
      return;
    }
    setLoggedIn(true);
    loadRanking();
  };

  // ✅ LOGIN
  if (!loggedIn) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "purple"
      }}>
        <div style={{ background: "white", padding: "20px" }}>
          <h2>⚽ WK Poule</h2>

          <input placeholder="Naam" onChange={(e) => setName(e.target.value)} /><br /><br />
          <input placeholder="Poule" onChange={(e) => setPool(e.target.value)} /><br /><br />

          <button onClick={login}>Start</button>
        </div>
      </div>
    );
  }

  // ✅ APP
  return (
    <div style={{ padding: "20px" }}>

      <h1>🏆 WK Poule LIVE</h1>

      {matches.map(m => {
        const live = realScores[m.id];

        return (
          <div key={m.id} style={{ marginBottom: "10px" }}>
            {m.home}

            <input
              type="number"
              value={predictions[m.id]?.home ?? ""}
              onChange={(e) => handleScore(m.id, "home", e.target.value)}
              style={{ width: "40px", margin: "0 5px" }}
            />

            -

            <input
              type="number"
              value={predictions[m.id]?.away ?? ""}
              onChange={(e) => handleScore(m.id, "away", e.target.value)}
              style={{ width: "40px", margin: "0 5px" }}
            />

            {m.away}

            {live && (
              <span style={{ marginLeft: "10px", color: "red" }}>
                🔴 {live.home} - {live.away}
              </span>
            )}
          </div>
        );
      })}

      <button onClick={save}>Opslaan</button>

      <h2>Jouw punten: {points}</h2>

      <h2>🏆 Ranking ({pool})</h2>

      {players
        .sort((a, b) => b.points - a.points)
        .map((p, i) => (
          <div key={i}>
            #{i + 1} {p.name} - {p.points} punten
          </div>
        ))}

      <pre>{JSON.stringify(predictions, null, 2)}</pre>

    </div>
  );
}