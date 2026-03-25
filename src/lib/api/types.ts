export interface ApiParams {
    [key: string]: string | number | undefined
    pageNumber?: number
    filtro?: number
    data_inicio?: string
    data_fim?: string
}

export interface ApiResponse<T> {
    data: T[]
    totalPages: number
    currentPage: number
    totalItems: number
}