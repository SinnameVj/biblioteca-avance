import React, { useState } from 'react'
import { User, Phone, Mail, Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Info, Save } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import './Profile.css'

const Profile = () => {
  const { currentUser, updateProfile, showToast } = useAppContext()

  // Personal info state
  const [name, setName] = useState(currentUser.name || '')
  const [phone, setPhone] = useState(currentUser.phone || '')
  const [saving, setSaving] = useState(false)

  // Password state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')

  const roleLabel = currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'profesor' ? 'Docente' : 'Estudiante'
  const roleClass = currentUser.role === 'admin' ? 'admin' : currentUser.role === 'profesor' ? 'profesor' : 'estudiante'

  const avatarBg = currentUser.role === 'profesor' ? '#8B5CF6' : currentUser.role === 'admin' ? '#F59E0B' : '#3B82F6'

  // Personal info save
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateProfile(currentUser.id, name, phone)
    showToast('Datos actualizados correctamente')
    setSaving(false)
  }

  // Password validation
  const hasMinLength = newPwd.length >= 6
  const hasUpperCase = /[A-Z]/.test(newPwd)
  const hasNumber = /[0-9]/.test(newPwd)
  const passwordsMatch = newPwd === confirmPwd && confirmPwd.length > 0
  const canSubmitPwd = hasMinLength && passwordsMatch && currentPwd.length > 0

  // Password change
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwdError('')

    if (!canSubmitPwd) return

    setPwdSaving(true)
    try {
      // Verify current password by re-authenticating
      const email = `${currentUser.username}@ucvvirtual.edu.pe`
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPwd })
      if (authError) {
        setPwdError('La contraseña actual es incorrecta.')
        setPwdSaving(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPwd })
      if (updateError) {
        setPwdError(updateError.message || 'Error al cambiar la contraseña.')
        setPwdSaving(false)
        return
      }

      showToast('Contraseña actualizada correctamente')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err) {
      setPwdError('Error inesperado. Intenta nuevamente.')
    }
    setPwdSaving(false)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="pf-header">
        <h1>Mi Perfil</h1>
        <p className="pf-subtitle">Gestiona tu información personal y seguridad de tu cuenta.</p>
      </div>

      {/* Two-column grid */}
      <div className="pf-grid">
        {/* LEFT: Personal Info */}
        <div className="pf-card">
          <div className="pf-card-header">
            <div className="pf-card-header-icon personal"><User size={18} /></div>
            <div className="pf-card-header-text">
              <h2>Información personal</h2>
              <p>Actualiza tus datos personales y de contacto.</p>
            </div>
          </div>

          <div className="pf-card-body">
            {/* Avatar block */}
            <div className="pf-avatar-block">
              <div className="pf-avatar" style={{ background: avatarBg }}>
                {(currentUser.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className="pf-avatar-name">{currentUser.name}</div>
                <div className="pf-avatar-email">{currentUser.username}@ucvvirtual.edu.pe</div>
                <span className={`pf-role-badge ${roleClass}`}>{roleLabel}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave}>
              <div className="pf-field">
                <label className="pf-label"><User size={13} /> Nombre completo</label>
                <input className="pf-input" type="text" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="pf-field">
                <label className="pf-label"><Phone size={13} /> WhatsApp / Celular</label>
                <input className="pf-input" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Ej. 987654321" maxLength={9} />
              </div>

              <div className="pf-field">
                <label className="pf-label"><Mail size={13} /> Correo institucional</label>
                <input className="pf-input" type="text" value={`${currentUser.username}@ucvvirtual.edu.pe`} disabled />
              </div>

              <div className="pf-field">
                <label className="pf-label"><Shield size={13} /> Rol del sistema</label>
                <input className="pf-input" type="text" value={roleLabel} disabled />
              </div>

              <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>
                <Save size={15} /> {saving ? 'Guardando...' : 'Actualizar datos'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Security */}
        <div className="pf-card">
          <div className="pf-card-header">
            <div className="pf-card-header-icon security"><Lock size={18} /></div>
            <div className="pf-card-header-text">
              <h2>Seguridad y acceso</h2>
              <p>Mantén tu cuenta segura actualizando tu contraseña.</p>
            </div>
          </div>

          <div className="pf-card-body">
            <form onSubmit={handlePasswordChange}>
              {pwdError && (
                <div className="pf-error-msg"><AlertCircle size={14} /> {pwdError}</div>
              )}

              <div className="pf-field">
                <label className="pf-label"><Lock size={13} /> Contraseña actual</label>
                <div className="pf-password-wrap">
                  <input className="pf-input" type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Ingresa tu contraseña actual" />
                  <button type="button" className="pf-eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pf-field">
                <label className="pf-label"><Lock size={13} /> Nueva contraseña</label>
                <div className="pf-password-wrap">
                  <input className="pf-input" type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Ingresa tu nueva contraseña" />
                  <button type="button" className="pf-eye-btn" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pf-field">
                <label className="pf-label"><Lock size={13} /> Confirmar nueva contraseña</label>
                <div className="pf-password-wrap">
                  <input className="pf-input" type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirma tu nueva contraseña" />
                  <button type="button" className="pf-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div className="pf-requirements">
                <div className="pf-requirements-title"><Info size={14} /> Requisitos de seguridad</div>
                <div className={`pf-req-item ${hasMinLength ? 'met' : ''}`}>
                  <CheckCircle size={12} /> Mínimo 6 caracteres
                </div>
                <div className={`pf-req-item ${hasUpperCase ? 'met' : ''}`}>
                  <CheckCircle size={12} /> Al menos una mayúscula
                </div>
                <div className={`pf-req-item ${hasNumber ? 'met' : ''}`}>
                  <CheckCircle size={12} /> Al menos un número
                </div>
                {confirmPwd.length > 0 && (
                  <div className={`pf-req-item ${passwordsMatch ? 'met' : ''}`}>
                    <CheckCircle size={12} /> Las contraseñas coinciden
                  </div>
                )}
              </div>

              <button type="submit" className="pf-btn pf-btn-security" disabled={!canSubmitPwd || pwdSaving}>
                <Lock size={15} /> {pwdSaving ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
