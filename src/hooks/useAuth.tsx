import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Mock auth provider. Sera remplace par MSAL en Phase 5.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Auto-login en mode dev pour faciliter le developpement
    const saved = localStorage.getItem('eq_mock_user')
    return saved ? JSON.parse(saved) as User : null
  })

  const login = useCallback(async () => {
    // TODO: MSAL acquireTokenPopup
    const mockUser: User = {
      id: 'user-1',
      name: 'Formateur Demo',
      email: 'formateur@planel.fr',
    }
    setUser(mockUser)
    localStorage.setItem('eq_mock_user', JSON.stringify(mockUser))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('eq_mock_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
