import { createContext, useContext, useState } from 'react'
import {
  clearCurrentUser,
  getCurrentUser,
  getUsers,
  hashPassword,
  saveUsers,
  setCurrentUser,
} from '../utils/storage'

const AuthContext = createContext(null)

// Strip the password hash before the user object leaves this module.
const toPublicUser = ({ passwordHash: _passwordHash, ...user }) => user

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser)

  const register = async ({ name, email, phone, password }) => {
    const users = getUsers()
    const normalizedEmail = email.trim().toLowerCase()

    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('An account with this email already exists')
    }

    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    }
    saveUsers([...users, newUser])
  }

  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const found = getUsers().find((u) => u.email === normalizedEmail)
    const passwordHash = await hashPassword(password)

    if (!found || found.passwordHash !== passwordHash) {
      throw new Error('Invalid email or password')
    }

    const sessionUser = { ...toPublicUser(found), lastLoginAt: new Date().toISOString() }
    setCurrentUser(sessionUser)
    setUser(sessionUser)
    return sessionUser
  }

  const logout = () => {
    clearCurrentUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
