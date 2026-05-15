import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  useEffect(() => {
    async function fetchGroups() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/trips`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch groups");
        }

        setGroups(data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            Bem-vindo, {user?.name || "User"}
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.createButton}
            onClick={() => navigate("/groups/new")}
          >
            + Criar Grupo
          </button>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p>A carregar...</p>
      ) : (
        <div style={styles.grid}>
          {groups.length === 0 ? (
            <p>Sem grupos ainda.</p>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                style={styles.card}
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <h2 style={styles.cardTitle}>{group.name}</h2>
                <p style={styles.cardText}>Destino: {group.destination}</p>
                <p style={styles.cardText}>
                  Participantes: {group.participants?.length || 0}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    padding: "32px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#666",
  },
  createButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
  logoutButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "10px",
  },
  cardText: {
    margin: "6px 0",
    color: "#444",
  },
};