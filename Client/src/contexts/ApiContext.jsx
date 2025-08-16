// src/contexts/ApiContext.jsx
import React from 'react'
import { api } from '@/lib/api'
import { useAuth } from './AuthContext'

export const ApiContext = React.createContext(null)

export function ApiProvider({ children }) {
  const { getIdToken } = useAuth()
  const value = React.useMemo(() => ({
    nearby: api.nearby,
    createRequest: async (body) => api.createRequest(body, await getIdToken()),
    myRequests: async () => api.myRequests(await getIdToken()),
    closeRequest: async (id) => api.closeRequest(id, await getIdToken()),
    deleteRequest: async (id) => api.deleteRequest(id, await getIdToken()),
    getRequest: async (id) => api.getRequest(id, await getIdToken()),
    getMyMembership: async (id) => api.getMyMembership(id, await getIdToken()),
    joinRequest: async (id) => api.joinRequest(id, await getIdToken()),
    leaveRequest: async (id) => api.leaveRequest(id, await getIdToken()),
    listMessages: async (id) => api.listMessages(id, await getIdToken()),
    sendMessage: async (id, text) => api.sendMessage(id, text, await getIdToken()),
  }), [getIdToken])

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export function useApi() {
  const ctx = React.useContext(ApiContext)
  if (!ctx) throw new Error('useApi must be used within <ApiProvider>')
  return ctx
}
