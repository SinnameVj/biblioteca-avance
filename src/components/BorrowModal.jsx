import React, { useState } from "react";
import { FileText, Calendar, X, Info, Phone } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const BorrowModal = ({ book, currentUser, onConfirm, onCancel }) => {
  const { showToast } = useAppContext();
  const [agreed, setAgreed] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [phone, setPhone] = useState(currentUser.phone || "");

  if (!book) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!agreed) return;
    if (phone.length < 9) {
      showToast("Por favor ingrese un número de contacto válido.", "error");
      return;
    }
    onConfirm(book.id, currentUser.id, isExtending, phone);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        insert: 0,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 9999,
        padding: "2rem 1rem",
        overflowY: "auto",
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "550px",
          padding: "2.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Generar Boleto de Préstamo
          </h2>
          <button
            onClick={onCancel}
            style={{ background: "transparent", color: "var(--text-muted)" }}
          >
            <X size={24} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "var(--bg-tertiary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <img
            src={book.cover}
            alt={book.title}
            style={{
              width: "80px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "4px",
              boxShadow: "var(--shadow-sm)",
            }}
          />
          <div>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "0.25rem",
                color: "var(--text-primary)",
              }}
            >
              {book.title}
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
              }}
            >
              {book.author}
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              ISBN: {book.isbn}
            </p>
            <span
              className="badge badge-success"
              style={{ marginTop: "0.5rem" }}
            >
              Disponible ({book.availableCopies} copias)
            </span>
          </div>
        </div>

        <form onSubmit={handleConfirm}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h4
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FileText size={16} /> Datos del Solicitante
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <label
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  Nombre Oficial
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={currentUser.name}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>
              <div>
                <label
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  Correo Institucional
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={`${currentUser.username}@ucvvirtual.edu.pe`}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>

            <div
              style={{
                background: "#1c1c1c",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-focus)",
              }}
            >
              <label
                style={{
                  fontSize: "0.85rem",
                  color: "var(--success-text)",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 600,
                }}
              >
                <Phone size={14} /> Contacto WhatsApp Requerido
              </label>
              <input
                type="tel"
                placeholder="Ej. 987654321"
                className="input-field"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
                required
                maxLength={9}
                style={{
                  borderColor: "var(--success-border)",
                  background: "var(--bg-primary)",
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.5rem",
                }}
              >
                * El Administrador utilizará esta vía para emitir boletas de
                cobranza en caso de retraso.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h4
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Calendar size={16} /> Términos de Tiempo Físico
            </h4>
            <div
              style={{
                padding: "1rem",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-primary)",
              }}
            >
              <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Duración Oficial: <strong>14 Días Naturales</strong>
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                * El periodo comenzará a contar en el momento exacto en el que
                el administrador firme la entrega del ejemplar físico en
                ventanilla.
              </p>

              {currentUser.role === "profesor" && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    marginTop: "1rem",
                    color: "var(--accent-gold)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isExtending}
                    onChange={(e) => setIsExtending(e.target.checked)}
                  />
                  Aplicar Extensión Académica Docente (30 días de periodo)
                </label>
              )}
            </div>
          </div>

          <div
            style={{
              marginBottom: "2rem",
              padding: "1.25rem",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <h4
              style={{
                fontSize: "0.9rem",
                color: "#F59E0B",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                fontWeight: 700,
              }}
            >
              <Info size={16} /> COMPROMISO DE DEVOLUCIÓN ⏳
            </h4>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              Al confirmar, acepto la política de permanencia. En caso de
              retraso, se aplicará una mora administrativa de{" "}
              <strong>S/ 1.00 por día natural</strong> 💸 hasta la entrega del
              ejemplar en mostrador.
            </p>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              cursor: "pointer",
              marginBottom: "2rem",
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: "0.2rem" }}
              required
            />
            <span
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: 1.4,
              }}
            >
              He revisado la solicitud e iré a la ventanilla de Administración a
              concluir el trámite en físico.
            </span>
          </label>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
          >
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!agreed}
              style={{ opacity: agreed ? 1 : 0.5 }}
            >
              Enviar Solicitud a Mostrador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowModal;
