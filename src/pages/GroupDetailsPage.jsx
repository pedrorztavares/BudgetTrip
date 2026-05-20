import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function GroupDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [currentUserBalance, setCurrentUserBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const [participantEmail, setParticipantEmail] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReceiptFile, setExpenseReceiptFile] = useState(null);
  const [addingExpense, setAddingExpense] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [openExpenseMenuId, setOpenExpenseMenuId] = useState(null);

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseTitle, setEditExpenseTitle] = useState("");
  const [editExpenseAmount, setEditExpenseAmount] = useState("");
  const [updatingExpense, setUpdatingExpense] = useState(false);

  async function fetchBalances() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/trips/${id}/balances`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch balances");
      }

      setBalances(data.balances || []);
      setSettlements(data.settlements || []);
      setCurrentUserBalance(data.currentUserBalance || null);
    } catch (error) {
      console.error("Fetch balances error:", error);
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        const [groupResponse, expensesResponse, balancesResponse] =
          await Promise.all([
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
            fetch(`${API_BASE_URL}/trips/${id}/balances`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        const groupData = await groupResponse.json();
        const expensesData = await expensesResponse.json();
        const balancesData = await balancesResponse.json();

        if (!groupResponse.ok) {
          throw new Error(groupData.message || "Failed to fetch group");
        }

        if (!expensesResponse.ok) {
          throw new Error(expensesData.message || "Failed to fetch expenses");
        }

        if (!balancesResponse.ok) {
          throw new Error(balancesData.message || "Failed to fetch balances");
        }

        setGroup(groupData);
        setExpenses(expensesData);
        setBalances(balancesData.balances || []);
        setSettlements(balancesData.settlements || []);
        setCurrentUserBalance(balancesData.currentUserBalance || null);
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
      await fetchBalances();
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

      await fetchBalances();
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

  function startEditingExpense(expense) {
    setEditingExpenseId(expense.id);
    setEditExpenseTitle(expense.title);
    setEditExpenseAmount(String(expense.amount));
    setOpenExpenseMenuId(null);
  }

  function cancelEditingExpense() {
    setEditingExpenseId(null);
    setEditExpenseTitle("");
    setEditExpenseAmount("");
  }

  async function handleUpdateExpense(expenseId) {
    try {
      setUpdatingExpense(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/trips/${id}/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editExpenseTitle,
            amount: editExpenseAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update expense");
      }

      setExpenses((prev) =>
        prev.map((expense) => (expense.id === expenseId ? data : expense))
      );

      cancelEditingExpense();
      await fetchBalances();
    } catch (error) {
      console.error("Update expense error:", error);
      alert(error.message);
    } finally {
      setUpdatingExpense(false);
    }
  }

  async function handleDeleteExpense(expenseId) {
    const confirmDelete = window.confirm(
      "Tens a certeza que queres apagar esta despesa?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/trips/${id}/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete expense");
      }

      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));

      setOpenExpenseMenuId(null);
      await fetchBalances();
    } catch (error) {
      console.error("Delete expense error:", error);
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

            {currentUserBalance ? (
              <div>
                {currentUserBalance.balance > 0 && (
                  <p style={styles.positiveBalance}>
                    Devem-te €{currentUserBalance.balance.toFixed(2)}
                  </p>
                )}

                {currentUserBalance.balance < 0 && (
                  <p style={styles.negativeBalance}>
                    Estás a dever €
                    {Math.abs(currentUserBalance.balance).toFixed(2)}
                  </p>
                )}

                {currentUserBalance.balance === 0 && (
                  <p style={styles.neutralBalance}>
                    Estás sem dívidas neste grupo
                  </p>
                )}
              </div>
            ) : (
              <p>Sem informação de saldos.</p>
            )}

            <div style={styles.settlementsBox}>
              <h3 style={styles.smallTitle}>Pagamentos sugeridos</h3>

              {settlements.length > 0 ? (
                settlements.map((settlement, index) => (
                  <div key={index} style={styles.settlementItem}>
                    <span>
                      <strong>{settlement.from.name}</strong> deve pagar{" "}
                      <strong>€{settlement.amount.toFixed(2)}</strong> a{" "}
                      <strong>{settlement.to.name}</strong>
                    </span>
                  </div>
                ))
              ) : (
                <p style={styles.noExpenses}>Não há pagamentos pendentes.</p>
              )}
            </div>

            <div style={styles.balancesList}>
              <h3 style={styles.smallTitle}>Saldos individuais</h3>

              {balances.map((person) => (
                <div key={person.userId || person.email} style={styles.balanceItem}>
                  <span>{person.name}</span>

                  {person.balance > 0 && (
                    <strong style={styles.balancePositive}>
                      +€{person.balance.toFixed(2)}
                    </strong>
                  )}

                  {person.balance < 0 && (
                    <strong style={styles.balanceNegative}>
                      -€{Math.abs(person.balance).toFixed(2)}
                    </strong>
                  )}

                  {person.balance === 0 && (
                    <strong style={styles.balanceNeutral}>€0.00</strong>
                  )}
                </div>
              ))}
            </div>
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
                  onChange={(e) =>
                    setExpenseReceiptFile(e.target.files?.[0] || null)
                  }
                  style={styles.formInput}
                />

                <button
                  type="submit"
                  style={styles.saveExpenseButton}
                  disabled={addingExpense}
                >
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

                      <div style={styles.expenseMenuWrapper}>
                        <button
                          type="button"
                          style={styles.expenseMenuButton}
                          onClick={() =>
                            setOpenExpenseMenuId((prev) =>
                              prev === expense.id ? null : expense.id
                            )
                          }
                        >
                          •••
                        </button>

                        {openExpenseMenuId === expense.id && (
                          <div style={styles.expenseDropdown}>
                            <button
                              type="button"
                              style={styles.dropdownButton}
                              onClick={() => startEditingExpense(expense)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              style={styles.dropdownDeleteButton}
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              Apagar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingExpenseId === expense.id ? (
                      <div style={styles.editExpenseForm}>
                        <input
                          type="text"
                          value={editExpenseTitle}
                          onChange={(e) => setEditExpenseTitle(e.target.value)}
                          style={styles.formInput}
                        />

                        <input
                          type="number"
                          step="0.01"
                          value={editExpenseAmount}
                          onChange={(e) => setEditExpenseAmount(e.target.value)}
                          style={styles.formInput}
                        />

                        <div style={styles.editExpenseButtons}>
                          <button
                            type="button"
                            style={styles.saveEditButton}
                            onClick={() => handleUpdateExpense(expense.id)}
                            disabled={updatingExpense}
                          >
                            {updatingExpense ? "A guardar..." : "Guardar"}
                          </button>

                          <button
                            type="button"
                            style={styles.cancelEditButton}
                            onClick={cancelEditingExpense}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={styles.expenseText}>
                          Pago por: {expense.paidByName || "N/A"}
                        </p>

                        <p style={styles.expenseText}>Valor: €{expense.amount}</p>

                        <p style={styles.expenseText}>
                          Data:{" "}
                          {expense.createdAt
                            ? new Date(expense.createdAt).toLocaleDateString(
                                "pt-PT"
                              )
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
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p style={styles.noExpenses}>
                  Ainda não existem despesas neste grupo.
                </p>
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

  positiveBalance: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#16a34a",
    marginTop: "16px",
  },

  negativeBalance: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#dc2626",
    marginTop: "16px",
  },

  neutralBalance: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#444",
    marginTop: "16px",
  },

  settlementsBox: {
    marginTop: "24px",
  },

  smallTitle: {
    margin: "0 0 12px 0",
    fontSize: "16px",
  },

  settlementItem: {
    backgroundColor: "#f8f8f8",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "8px",
  },

  balancesList: {
    marginTop: "24px",
  },

  balanceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "8px",
  },

  balancePositive: {
    color: "#16a34a",
  },

  balanceNegative: {
    color: "#dc2626",
  },

  balanceNeutral: {
    color: "#444",
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

  expenseMenuWrapper: {
    position: "relative",
  },

  expenseMenuButton: {
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "24px",
    lineHeight: 1,
    padding: "4px 8px",
  },

  expenseDropdown: {
    position: "absolute",
    right: 0,
    top: "30px",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 10,
    minWidth: "120px",
    overflow: "hidden",
  },

  dropdownButton: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    backgroundColor: "#fff",
    cursor: "pointer",
    textAlign: "left",
  },

  dropdownDeleteButton: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    backgroundColor: "#fff",
    color: "#dc2626",
    cursor: "pointer",
    textAlign: "left",
  },

  editExpenseForm: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "#efefef",
    padding: "12px",
    borderRadius: "10px",
  },

  editExpenseButtons: {
    display: "flex",
    gap: "10px",
  },

  saveEditButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },

  cancelEditButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#6b7280",
    color: "#fff",
    cursor: "pointer",
  },
};