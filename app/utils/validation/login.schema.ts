import { object, string } from 'yup'

export const loginSchema = object({
  login: string().trim().required('Login is required').min(2, 'Too short'),
  password: string().required('Password is required').min(1, 'Too short'),
})
