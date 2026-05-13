import React, { useState } from 'react'
import { BookOpen, AlertCircle, UserPlus, LogIn } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const Login = () => {
  const { login, registerUser } = useAppContext()
  const [isLoginTab, setIsLoginTab] = useState(true)
  
  // Login State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Register State
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('estudiante')
  const [regPhone, setRegPhone] = useState('')

  const handlePhoneInput = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 9)
    setRegPhone(onlyDigits)
  }

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const email = `${username}@ucvvirtual.edu.pe`
    const { success, error } = await login(email, password)
    if (!success) {
      setError(error?.message || 'Credenciales inválidas. Por favor intente de nuevo.')
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return;
    }
    const email = `${regUsername}@ucvvirtual.edu.pe`
    const { success: successReg, error: regError } = await registerUser({
      email,
      name: regName,
      username: regUsername,
      password: regPassword,
      role: regRole,
      phone: regPhone
    })
    
    if (successReg) {
      setSuccess('Usuario registrado institucionalmente. Ya puedes Iniciar Sesión.')
      setIsLoginTab(true)
      setUsername(regUsername)
      setPassword('')
    } else {
      setError(regError?.message || 'Error al registrar usuario en el sistema.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg-primary)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'var(--bg-tertiary)', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--border-light)', color: 'var(--accent-primary)' }}>
            <BookOpen size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'Inter' }}>Universidad César Vallejo</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Campus Chimbote - Gestión de Biblioteca</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '2rem', background: 'var(--bg-tertiary)', borderRadius: '14px', padding: '0.35rem' }}>
          <button 
            type="button"
            onClick={() => { setIsLoginTab(true); setError(''); setSuccess(''); }}
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              borderRadius: '10px', 
              background: isLoginTab ? 'var(--accent-primary)' : 'transparent', 
              color: isLoginTab ? '#FFFFFF' : 'var(--text-muted)', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              transition: 'all 0.2s',
              boxShadow: isLoginTab ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            <LogIn size={18} /> Ingresar
          </button>
          <button 
            type="button"
            onClick={() => { setIsLoginTab(false); setError(''); setSuccess(''); }}
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              borderRadius: '10px', 
              background: !isLoginTab ? 'var(--accent-primary)' : 'transparent', 
              color: !isLoginTab ? '#FFFFFF' : 'var(--text-muted)', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              transition: 'all 0.2s',
              boxShadow: !isLoginTab ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            <UserPlus size={18} /> Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="animate-fade-in" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}
        
        {success && (
          <div className="animate-fade-in" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success-text)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <AlertCircle size={18} /> {success}
          </div>
        )}

        {isLoginTab ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Identidad de Usuario / Correo</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. mlopez"
                  style={{ borderRight: 'none', borderRadius: '8px 0 0 8px',flex: 1 }}
                />
                <span style={{ padding: '0 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderLeft: 'none', borderRadius: '0 8px 8px 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', height: '42px', fontSize: '0.85rem' }}>
                  @ucvvirtual.edu.pe
                </span>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Contraseña de Sistema</label>
              <input 
                type="password" 
                required 
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduzca su clave"
              />
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.8rem' }}>
              Iniciar Sesión
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nombre Completo Oficial</label>
              <input 
                type="text" 
                required 
                className="input-field"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Prefijo de Usuario / ID</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().trim())}
                  placeholder="ej. jperez"
                  style={{ borderRight: 'none', borderRadius: '8px 0 0 8px', flex: 1 }}
                />
                <span style={{ padding: '0 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderLeft: 'none', borderRadius: '0 8px 8px 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', height: '42px', fontSize: '0.8rem' }}>
                  @ucvvirtual.edu.pe
                </span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Rol en Campus</label>
              <select className="input-field" value={regRole} onChange={e=>setRegRole(e.target.value)}>
                <option value="estudiante">Estudiante UCV</option>
                <option value="profesor">Docente UCV</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Crear Contraseña</label>
              <input 
                type="password" 
                required 
                className="input-field"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>WhatsApp / Celular</label>
              <input 
                type="tel" 
                className="input-field"
                value={regPhone}
                onChange={handlePhoneInput}
                placeholder="Ej. 987654321 (9 dígitos)"
                maxLength={9}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.8rem' }}>
              Registrarse en la Biblioteca
            </button>
          </form>
        )}


      </div>
    </div>
  )
}

export default Login
