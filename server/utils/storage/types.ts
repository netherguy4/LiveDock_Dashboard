export type StoredUser = {
  id: string
  login: string
  passwordHash: string
  isDemo: boolean
  createdAt: string
  updatedAt: string
}

export type StoredHost = {
  id: string
  userId: string
  name: string
  url: string
  token?: string
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = {
  login: string
  passwordHash: string
}

export type UpdateUserInput = {
  login?: string
  passwordHash?: string
}

export type CreateHostInput = {
  name: string
  url: string
  token?: string
}

export type UpdateHostInput = Partial<CreateHostInput>

export type AppStorage = {
  listUsers(): Promise<StoredUser[]>
  getUserByLogin(login: string): Promise<StoredUser | null>
  createUser(input: CreateUserInput): Promise<StoredUser>
  updateUser(id: string, input: UpdateUserInput): Promise<StoredUser | null>
  deleteUser(id: string): Promise<boolean>
  listHosts(userId: string): Promise<StoredHost[]>
  getHost(userId: string, id: string): Promise<StoredHost | null>
  createHost(userId: string, input: CreateHostInput): Promise<StoredHost>
  updateHost(userId: string, id: string, input: UpdateHostInput): Promise<StoredHost | null>
  deleteHost(userId: string, id: string): Promise<boolean>
  setDemoFlag(id: string, value: boolean): Promise<boolean>
  close?(): void | Promise<void>
}
