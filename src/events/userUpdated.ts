// src/events/userUpdated.ts
export const USER_UPDATED_EVENT = 'userUpdated'

export interface UserUpdatedData {
    name: string
    email: string
    role?: string
    centrosCusto?: string[]
}

export function dispatchUserUpdated(userData: UserUpdatedData) {
    const event = new CustomEvent(USER_UPDATED_EVENT, { detail: userData })
    window.dispatchEvent(event)
    console.log('📡 Evento userUpdated disparado:', userData)
}

export function onUserUpdated(callback: (userData: UserUpdatedData) => void) {
    const handler = (event: Event) => {
        const customEvent = event as CustomEvent<UserUpdatedData>
        callback(customEvent.detail)
    }
    window.addEventListener(USER_UPDATED_EVENT, handler)

    // Retorna função para remover o listener
    return () => window.removeEventListener(USER_UPDATED_EVENT, handler)
}