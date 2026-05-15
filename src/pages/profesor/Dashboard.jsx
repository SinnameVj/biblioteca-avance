import React, { useState } from "react";
import {
  BookMarked,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { getDaysRemaining } from "../../utils/penalties";
import BorrowModal from "../../components/BorrowModal";
import { useNavigate } from "react-router-dom";

const ProfDashboard = () => {
  const {
    books,
    loans,
    reservations,
    heldBooks,
    currentUser,
    reserveBook,
    claimHeldBook,
    rejectHeldBook,
    requestBorrow,
  } = useAppContext();
  const [borrowModalData, setBorrowModalData] = useState({
    isOpen: false,
    book: null,
  });
  const navigate = useNavigate();

  const myLoans = loans.filter((l) => l.userId === currentUser.id);
  const myHeldBooks = heldBooks.filter((h) => h.userId === currentUser.id);
  const myReservations = reservations.filter(
    (r) => r.userId === currentUser.id,
  );

  const recentBooks = [...books].reverse().slice(0, 4);

  const handleBorrowRequest = (book) => {
    setBorrowModalData({ isOpen: true, book });
  };

  const confirmBorrow = (bookId, userId, isExtending) => {
    requestBorrow(bookId, userId, isExtending);
    setBorrowModalData({ isOpen: false, book: null });
  };

  return (
    <div>
      {borrowModalData.isOpen && (
        <BorrowModal
          book={borrowModalData.book}
          currentUser={currentUser}
          onConfirm={confirmBorrow}
          onCancel={() => setBorrowModalData({ isOpen: false, book: null })}
        />
      )}

      <div style={{ marginBottom: "2.5rem" }}>
        <h1
          style={{
            fontSize: "1.8rem",
            marginBottom: "0.25rem",
            fontFamily: "Inter",
            fontWeight: 600,
          }}
        >
          Área Docente
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Bienvenido, {currentUser?.name}. Explore el catálogo y gestione sus
          reservas prioritarias.
        </p>
      </div>

      {myHeldBooks.length > 0 && (
        <div
          style={{
            marginBottom: "3rem",
            background: "#3F3F46",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--accent-gold)",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--accent-gold)",
              fontWeight: 600,
            }}
          >
            <Star size={20} /> Sus libros en lista prioritaria han llegado al
            mostrador
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {myHeldBooks.map((h) => {
              const book = books.find((b) => b.id === h.bookId);
              return (
                <div
                  key={h.id}
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      style={{
                        width: "40px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                        {book.title}
                      </p>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Mantenemos el bloqueo de inventario por 48 horas
                        exclusivamente para usted.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => rejectHeldBook(h.id)}
                      className="btn-secondary"
                      style={{
                        padding: "0.5rem 0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <XCircle size={16} /> Liberar libro
                    </button>
                    <button
                      onClick={() => claimHeldBook(h.id)}
                      style={{
                        padding: "0.5rem 0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        background: "var(--accent-gold)",
                        color: "#000",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle size={16} /> Procesar Formalidad
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: "2rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontFamily: "Inter",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Novedades al Catálogo
            </h2>
            <button
              onClick={() => navigate("/profesor/catalogo")}
              className="btn-secondary"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
            >
              Explorar Todos
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginBottom: "3rem",
            }}
          >
            {recentBooks.map((book, idx) => {
              const isReservedByMe = myReservations.some(
                (r) => r.bookId === book.id,
              );
              const isLoanedByMe = myLoans.some((l) => l.bookId === book.id);
              const isHeldForMe = myHeldBooks.some((h) => h.bookId === book.id);

              return (
                <div
                  key={book.id}
                  className={`glass-panel animate-fade-in delay-${idx + 1}`}
                  style={{
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: "240px",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      marginBottom: "1rem",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      marginBottom: "0.25rem",
                      fontWeight: 600,
                    }}
                  >
                    {book.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {book.author}
                  </p>

                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background:
                          book.availableCopies > 0
                            ? "var(--success-bg)"
                            : "var(--warning-bg)",
                        color:
                          book.availableCopies > 0
                            ? "var(--success-text)"
                            : "var(--warning-text)",
                      }}
                    >
                      {book.availableCopies} Disp.
                    </span>

                    {isLoanedByMe ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Operación Activa
                      </span>
                    ) : isHeldForMe ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--accent-gold)",
                          fontWeight: 500,
                        }}
                      >
                        Su Turno
                      </span>
                    ) : isReservedByMe ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--accent-gold)",
                          fontWeight: 500,
                        }}
                      >
                        Prioridad Ejecutada
                      </span>
                    ) : book.availableCopies > 0 ? (
                      <button
                        onClick={() => handleBorrowRequest(book)}
                        className="btn-primary"
                        style={{
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        Solicitar
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          reserveBook(book.id, currentUser.id, true)
                        }
                        style={{
                          background: "var(--bg-tertiary)",
                          border: "1px solid var(--accent-gold)",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          color: "var(--accent-gold)",
                          cursor: "pointer",
                        }}
                        title="Reserva prioritaria de docente"
                      >
                        Reserva <Star size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div
            className="glass-panel"
            style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <BookMarked size={20} color="var(--accent-primary)" /> Panorama
              Rápido
            </h2>

            {myLoans.length === 0 ? (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  padding: "1rem 0",
                }}
              >
                No posee responsabilidades de inventario actualmente.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {myLoans.map((loan) => {
                  const book = books.find((b) => b.id === loan.bookId);

                  let statusText = "ESPERANDO RECOGIDA";
                  let progressColor = "var(--text-primary)";
                  let progressBg = "var(--warning-bg)";

                  if (loan.status === "pending_pickup") {
                    statusText = "RECOGIDA EN CAJA";
                  } else if (loan.status === "pending_return") {
                    statusText = "REVISIÓN DE DEVOLUCIÓN";
                    progressBg = "var(--info-bg)";
                  } else {
                    const { days, status } = getDaysRemaining(loan.dueDate);
                    if (status === "overdue" || status === "urgent") {
                      progressColor = "var(--danger-text)";
                      progressBg = "var(--danger-bg)";
                      statusText = `Vencido ${days} d`;
                    } else if (status === "warning") {
                      progressColor = "var(--warning-text)";
                      progressBg = "var(--warning-bg)";
                      statusText = `Aviso ${days} d`;
                    } else {
                      statusText = `En Plazo ${days} d`;
                      progressColor = "var(--success-text)";
                      progressBg = "var(--success-bg)";
                    }
                  }

                  return (
                    <div
                      key={loan.id}
                      style={{
                        background: "var(--bg-primary)",
                        padding: "1rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {book?.title}
                      </p>
                      <span
                        className="badge"
                        style={{ background: progressBg, color: progressColor }}
                      >
                        <Clock size={12} /> {statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate("/profesor/prestamos")}
              className="btn-secondary"
              style={{ width: "100%", marginTop: "1rem", fontSize: "0.85rem" }}
            >
              Ver detalles y devolver
            </button>
          </div>

          <div
            style={{
              padding: "1.5rem",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <h3
              style={{
                fontSize: "1.05rem",
                marginBottom: "0.5rem",
                color: "var(--accent-gold)",
                fontWeight: 600,
              }}
            >
              Política Docente
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              Al ser parte del profesorado goza de dos privilegios: extensiones
              de 30 días al solicitar en sistema y evasión de colas globales (El
              botón amarillo "Reserva ⭐" asigna el primer tiraje exclusivamente
              a usted).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfDashboard;
