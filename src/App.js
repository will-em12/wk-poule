import React, { useState, useEffect } from "react";

const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";
const API_URL = "https://api.football-data.org/v4/matches";

const groups = {
  A: ["USA", "Mexico", "Canada", "Japan"],
  B: ["Nederland", "Duitsland", "Senegal", "Ecuador"],
  C: ["Argentinië", "Polen", "Mexico", "Saudi-Arabië"],
  D: ["Frankrijk", "Denemarken", "Tunesië", "Australië"],
  E: ["Spanje", "Duitsland", "Japan", "Costa Rica"],
  F: ["België", "Kroatië", "Marokko", "Canada"],
  G: ["Brazilië", "Zwitserland", "Servië", "Kameroen"],
  H: ["Portugal", "Uruguay", "Zuid-Korea", "Ghana"]
};

const flag = (t) => t.slice(0, 2).toUpperCase();

export default function FinalUltimate() {

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [pool, setPool] = useState("vrienden");
  const [loggedIn, setLoggedIn] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [liveScores, setLiveScores] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [champion, setChampion] = useState("");

  useEffect(() => {
    fetchLive();
    const i = setInterval(fetchLive, 30000);
    return () => clearInterval(i);
  }, []);

  const fetchLive = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { "X-Auth-Token": "ade51590c8024835b133ec4ec93ec8e8" }
      });
      const data = await res.json();

      setLiveScores(
        data.matches?.slice(0, 5).map(m => ({
          home: m.homeTeam.name,
          away: m.awayTeam.name,
          score: `${m.score.fullTime.home ?? 0}-${m.score.fullTime.away ?? 0}`
        })) || []
      );
    } catch {
      setLiveScores([{ home: "NL", away: "DE", score: "2-1" }]);
    }
  };

  const login = () => {
    setLoggedIn(true);
    loadLeaderboard(pool);
  };

  const handleChange = (g, p, v) => {
    setPredictions({
      ...predictions,
      [g]: { ...predictions[g], [p]: v }
    });
  };

  const calculateScore = () => {
    let pts = 0;
    Object.values(predictions).forEach(gr =>
      Object.values(gr || {}).forEach(v => v && pts++)
    );
    if (champion) pts += 5;
    return pts;
  };

  const save = async () => {
    const score = calculateScore();

    await fetch(`${SUPABASE_URL}/rest/v1/poule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        user,
        pool,
        predictions,
        champion,
        score
      })
    });

    loadLeaderboard(pool);
  };

  const loadLeaderboard = async (p) => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/poule?pool=eq.${p}&select=*&order=score.desc`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    setLeaderboard(await res.json());
  };

  if (!loggedIn) {
    return (

      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #4f46e5, #9333ea)"
      }}>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "20px",
          width: "300px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}>
          <h1 className="text-xl font-bold text-center mb-4">⚽ WK Ultimate</h1>

          <input
            className="border p-2 w-full mb-2 rounded-xl"
            placeholder="Gebruiker"
            onChange={e => setUser(e.target.value)}
          />

          <input
            type="password"
            className="border p-2 w-full mb-2 rounded-xl"
            placeholder="Wachtwoord"
            onChange={e => setPassword(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-4 rounded-xl"
            placeholder="Poule"
            onChange={e => setPool(e.target.value)}
          />

          <button

            style={{
              background: "#4f46e5",
              color: "white",
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer"
            }}
            onClick={login}
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-100"} min-h-screen p-4`}>

      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">🏆 WK Ultimate</h1>
        <button onClick={() => setDarkMode(!darkMode)}>🌙</button>
      </div>

      <div className="bg-red-200 p-3 rounded-xl mb-4">
        <h2>🔴 Live</h2>
        {liveScores.map((m, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{m.home} vs {m.away}</span>
            <span>{m.score}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(groups).map(([g, t]) => (
          <div key={g} className="bg-white p-3 rounded-xl shadow">
            <h2 className="font-bold">Groep {g}</h2>
            {[1, 2, 3, 4].map(pos => (
              <select
                key={pos}
                className="w-full border p-1 mb-1 rounded"
                onChange={(e) => handleChange(g, pos, e.target.value)}
              >
                <option>{pos}</option>
                {t.map(team => (
                  <option key={team}>{flag(team)} {team}</option>
                ))}
              </select>
            ))}
          </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded-xl mt-4">
        <h2>🏆 Kampioen</h2>
        <input
          className="w-full border p-2 mt-2"
          onChange={(e) => setChampion(e.target.value)}
        />
      </div>

      <button
        onClick={save}
        className="bg-green-600 text-white w-full mt-4 p-3 rounded-xl"
      >
        Opslaan
      </button>

      <div className="mt-6">
        <h2>🏆 Ranking</h2>
        {leaderboard.map((u, i) => (
          <div key={i} className="flex justify-between">
            <span>#{i + 1} {u.user}</span>
            <span>{u.score}</span>
          </div>
        ))}
      </div>

    </div>
  );
}