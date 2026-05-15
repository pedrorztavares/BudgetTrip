import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function CreateGroupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  function addParticipant() {
    const email = participantEmail.trim().toLowerCase();

    if (!email) return;
    if (participants.includes(email)) {
      setParticipantEmail("");
      return;
    }

    setParticipants((prev) => [...prev, email]);
    setParticipantEmail("");
  }

  function removeParticipant(emailToRemove) {
    setParticipants((prev) => prev.filter((email) => email !== emailToRemove));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          destination,
          description,
          participants,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create group");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Create group error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Criar novo grupo</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Nome do grupo"
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Destino"
            style={styles.input}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />

          <textarea
            placeholder="Descrição"
            style={styles.textarea}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div style={styles.participantBox}>
            <label style={styles.label}>Participantes por email</label>

            <div style={styles.participantRow}>
              <input
                type="email"
                placeholder="exemplo@email.com"
                style={styles.input}
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
              />
              <button
                type="button"
                style={styles.addButton}
                onClick={addParticipant}
              >
                Adicionar
              </button>
            </div>

            <div style={styles.tags}>
              {participants.map((email) => (
                <div key={email} style={styles.tag}>
                  <span>{email}</span>
                  <button
                    type="button"
                    style={styles.tagButton}
                    onClick={() => removeParticipant(email)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate("/dashboard")}
            >
              Cancelar
            </button>
            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? "A criar..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    padding: "32px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    width: "100%",
    maxWidth: "700px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },
  title: {
    marginTop: 0,
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    width: "100%",
  },
  textarea: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    resize: "vertical",
  },
  participantBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontWeight: "bold",
  },
  participantRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  addButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#16a34a",
    color: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#e5e7eb",
    borderRadius: "999px",
    padding: "8px 12px",
  },
  tagButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
};