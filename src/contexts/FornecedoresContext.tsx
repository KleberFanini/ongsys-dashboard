import { createDataContext } from '@/src/lib/api/createDataContext'
import { Fornecedor } from '@/src/types/fornecedor'

export const { Provider: FornecedoresProvider, useData: useFornecedores } =
    createDataContext<Fornecedor>({ cacheKey: 'fornecedores_cache', endpoint: 'fornecedores' })