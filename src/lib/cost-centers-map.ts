// ongsys-dashboard/src/lib/cost-centers-map.ts
export const costCentersMap: Record<string, string> = {
    '3.01.01.001': 'CAB ATITUDE II.I - DESPESAS DIRETAS - ANT',
    '3.01.01.002': 'CAB ATITUDE II.I - DESPESAS DIRETAS - BREVE',
    '3.01.01.003': 'CAB ATITUDE II.I - DESPESAS DIRETAS - INT',
    '3.01.01.004': 'CAB ATITUDE II.I - DESPESAS DIRETAS',
    '3.02.01.001': 'CAR ATITUDE II.I - DESPESAS DIRETAS - ANT',
    '3.02.01.002': 'CAR ATITUDE II.I - DESPESAS DIRETAS - BREVE',
    '3.02.01.003': 'CAR ATITUDE II.I - DESPESAS DIRETAS - INT',
    '3.02.01.004': 'CAR ATITUDE II.I - DESPESAS DIRETAS',
    '3.03.01.001': 'JAB ATITUDE II.I - DESPESAS DIRETAS - ANT',
    '3.03.01.002': 'JAB ATITUDE II.I - DESPESAS DIRETAS - BREVE',
    '3.03.01.003': 'JAB ATITUDE II.I - DESPESAS DIRETAS - INT',
    '3.03.01.004': 'JAB ATITUDE II.I - DESPESAS DIRETAS',
    '3.04.01.001': 'REC ATITUDE II.I - DESPESAS DIRETAS - ANT',
    '3.04.01.002': 'REC ATITUDE II.I - DESPESAS DIRETAS - BREVE',
    '3.04.01.003': 'REC ATITUDE II.I - DESPESAS DIRETAS - INT',
    '3.04.01.004': 'REC ATITUDE II.I - DESPESAS DIRETAS',
}

// Função auxiliar para obter o nome formatado
export function getCostCenterName(code: string): string {
    return costCentersMap[code] || code
}

// Lista de centros de custo para o select (já ordenada)
export const costCentersList = Object.entries(costCentersMap)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name))