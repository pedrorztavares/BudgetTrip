import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function GroupDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [participantEmail, setParticipantEmail] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReceiptFile, setExpenseReceiptFile] = useState(null);
  const [addingExpense, setAddingExpense] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        const [groupResponse, expensesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/trips/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/trips/${id}/expenses`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const groupData = await groupResponse.json();
        const expensesData = await expensesResponse.json();

        if (!groupResponse.ok) {
          throw new Error(groupData.message || "Failed to fetch group");
        }

        if (!expensesResponse.ok) {
          throw new Error(expensesData.message || "Failed to fetch expenses");
        }

        setGroup(groupData);
        setExpenses(expensesData);
      } catch (error) {
        console.error("Error fetching group data:", error);
        alert(error.message);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate]);

  async function handleAddParticipant() {
    const email = participantEmail.trim().toLowerCase();

    if (!email) return;

    try {
      setAddingParticipant(true);

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/trips/${id}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add participant");
      }

      setGroup(data);
      setParticipantEmail("");
    } catch (error) {
      console.error("Add participant error:", error);
      alert(error.message);
    } finally {
      setAddingParticipant(false);
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault();

    try {
      setAddingExpense(true);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("title", expenseTitle);
      formData.append("amount", expenseAmount);

      if (expenseReceiptFile) {
        formData.append("receipt", expenseReceiptFile);
      }

      const response = await fetch(`${API_BASE_URL}/trips/${id}/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add expense");
      }

      setExpenses((prev) => [...prev, data]);

      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseReceiptFile(null);
      setShowExpenseForm(false);
    } catch (error) {
      console.error("Add expense error:", error);
      alert(error.message);
    } finally {
      setAddingExpense(false);
    }
  }

  async function handleViewReceipt(expenseId) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/trips/${id}/expenses/${expenseId}/receipt-link`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to open receipt");
      }

      window.open(data.url, "_blank");
    } catch (error) {
      console.error("View receipt error:", error);
      alert(error.message);
    }
  }

  if (loading) {
    return <div style={styles.page}>A carregar grupo...</div>;
  }

  if (!group) {
    return <div style={styles.page}>Grupo não encontrado.</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={() => navigate("/dashboard")}>
          ← Voltar
        </button>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.leftColumn}>
          <div style={styles.groupInfo}>
            <h1 style={styles.groupTitle}>{group.name}</h1>
            <p style={styles.groupMeta}>
              <strong>Destino:</strong> {group.destination}
            </p>
            <p style={styles.groupMeta}>
              <strong>Descrição:</strong>{" "}
              {group.description?.trim() ? group.description : "Sem descrição"}
            </p>
          </div>

          <div style={styles.participantsCard}>
            <h2 style={styles.sectionTitle}>Participantes</h2>

            <div style={styles.participantsList}>
              {group.participants?.length > 0 ? (
                group.participants.map((participant) => (
                  <div
                    key={`${participant.email}-${participant.userId || "pending"}`}
                    style={styles.participantItem}
                  >
                    <div style={styles.participantName}>
                      {participant.name?.trim() || participant.email}
                    </div>
                    <div style={styles.participantEmail}>{participant.email}</div>
                    <div style={styles.participantStatus}>
                      Estado: {participant.status}
                    </div>
                  </div>
                ))
              ) : (
                <p>Sem participantes.</p>
              )}
            </div>

            <div style={styles.addParticipantBox}>
              <input
                type="email"
                placeholder="email do participante"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                style={styles.addParticipantInput}
              />
              <button
                style={styles.addButton}
                type="button"
                onClick={handleAddParticipant}
                disabled={addingParticipant}
              >
                {addingParticipant ? "A adicionar..." : "Adicionar"}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.summaryCard}>
            <h2 style={styles.sectionTitle}>Resumo do grupo</h2>
            <p style={styles.summaryText}>
              Aqui futuramente será inicializada a função de divisão de desp
            </p>
          </div>

          <div style={styles.expensesCard}>
            <div style={styles.expensesHeader}>
              <h2 style={styles.sectionTitle}>Despesas</h2>
              <button
                style={styles.addButton}
                type="button"
                onClick={() => setShowExpenseForm((prev) => !prev)}
              >
                {showExpenseForm ? "Fechar" : "Adicionar"}
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleAddExpense} style={styles.expenseForm}>
                <input
                  type="text"
                  placeholder="Nome da despesa"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  style={styles.formInput}
                  required
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  style={styles.formInput}
                  required
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setExpenseReceiptFile(e.target.files?.[0] || null)}
                  style={styles.formInput}
                />

                <button type="submit" style={styles.saveExpenseButton} disabled={addingExpense}>
                  {addingExpense ? "A guardar..." : "Guardar despesa"}
                </button>
              </form>
            )}

            <div style={styles.expensesList}>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <div key={expense.id} style={styles.expenseItem}>
                    <div style={styles.expenseTopRow}>
                      <h3 style={styles.expenseTitle}>{expense.title}</h3>
                      <span style={styles.expenseMenu}>•••</span>
                    </div>

                    <p style={styles.expenseText}>
                      Pago por: {expense.paidByName || "N/A"}
                    </p>
                    <p style={styles.expenseText}>Valor: €{expense.amount}</p>
                    <p style={styles.expenseText}>
                      Data:{" "}
                      {expense.createdAt
                        ? new Date(expense.createdAt).toLocaleDateString("pt-PT")
                        : "Sem data"}
                    </p>

                    <div style={styles.expenseFooter}>
                      {expense.hasReceipt ? (
                        <button
                          type="button"
                          style={styles.receiptButton}
                          onClick={() => handleViewReceipt(expense.id)}
                        >
                          Ver comprovativo
                        </button>
                      ) : (
                        <span style={styles.noReceipt}>Sem comprovativo</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.noExpenses}>Ainda não existem despesas neste grupo.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    padding: "32px",
  },
  topBar: {
    marginBottom: "24px",
  },
  backButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "28px",
    alignItems: "start",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  groupInfo: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },
  groupTitle: {
    margin: "0 0 16px 0",
    fontSize: "36px",
  },
  groupMeta: {
    margin: "10px 0",
    fontSize: "18px",
    color: "#222",
  },
  participantsCard: {
    backgroundColor: "#d9d9d9",
    borderRadius: "16px",
    padding: "20px",
    minHeight: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },
  participantsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
  },
  participantItem: {
    backgroundColor: "#f8f8f8",
    borderRadius: "12px",
    padding: "12px",
  },
  participantName: {
    fontWeight: "bold",
    fontSize: "16px",
  },
  participantEmail: {
    color: "#555",
    fontSize: "14px",
    marginTop: "4px",
  },
  participantStatus: {
    fontSize: "13px",
    marginTop: "6px",
    color: "#666",
  },
  addParticipantBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  addParticipantInput: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    width: "100%",
  },
  summaryCard: {
    backgroundColor: "#d9d9d9",
    borderRadius: "16px",
    padding: "28px",
    minHeight: "170px",
  },
  summaryText: {
    marginTop: "16px",
    fontSize: "18px",
    lineHeight: 1.4,
  },
  expensesCard: {
    backgroundColor: "#d9d9d9",
    borderRadius: "16px",
    padding: "20px",
  },
  expensesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "12px",
  },
  expenseForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
    backgroundColor: "#efefef",
    padding: "16px",
    borderRadius: "12px",
  },
  formInput: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  saveExpenseButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
  expensesList: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  expenseItem: {
    padding: "16px 8px",
    borderTop: "1px solid #8f8f8f",
  },
  expenseTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseTitle: {
    margin: 0,
    fontSize: "18px",
  },
  expenseMenu: {
    fontSize: "26px",
    lineHeight: 1,
  },
  expenseText: {
    margin: "6px 0",
    color: "#333",
  },
  expenseFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    gap: "12px",
    flexWrap: "wrap",
  },
  receiptButton: {
    textDecoration: "none",
    border: "none",
    backgroundColor: "#fff",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#111",
  },
  noReceipt: {
    color: "#444",
    fontSize: "14px",
  },
  addButton: {
    padding: "10px 16px",
    borderRadius: "0",
    border: "none",
    backgroundColor: "#4b9c3a",
    color: "#fff",
    cursor: "pointer",
    fontSize: "16px",
  },
  noExpenses: {
    color: "#444",
  },
};