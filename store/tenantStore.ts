import { create } from 'zustand'
import Cookies from 'js-cookie'

type State = {
  tenantId: string | null
  setTenantId: (id: string | null) => void
}

export const useTenantStore = create<State>((set) => ({
  tenantId: typeof window !== 'undefined' ? Cookies.get('tenantId') || null : null,
  setTenantId: (id) => {
    if (id) Cookies.set('tenantId', id, { expires: 7 })
    else Cookies.remove('tenantId')
    set({ tenantId: id })
  },
}))
