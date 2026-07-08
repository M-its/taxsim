export type Client = {
  id: string
  name: string
  document: string
  email: string | null
  createdAt: string
}

export type ClientInput = {
  name: string
  document: string
  email: string
}

export type ClientListResponse = {
  data: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
