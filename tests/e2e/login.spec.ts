import { test, expect, type Page } from '@playwright/test'

const LOGIN = process.env.LOGIN ?? 'admin'
const PASSWORD = process.env.PASSWORD ?? ''

async function fillCredentials(page: Page, login: string, password: string) {
  const loginInput = page.locator('#login-input')
  const pwdInput = page.locator('#pwd-input')
  const submit = page.getByRole('button', { name: 'Войти' })

  await expect(loginInput).toBeVisible()
  await expect(pwdInput).toBeVisible()

  // Wait for Nuxt hydration before typing — otherwise v-model listeners
  // aren't attached yet and vee-validate's initialValues will overwrite
  // whatever Playwright filled, leaving the submit button disabled.
  await page.waitForFunction(() => {
    const w = window as unknown as { $nuxt?: { isHydrating?: boolean } }
    return w.$nuxt ? w.$nuxt.isHydrating === false : true
  })
  await page.waitForLoadState('networkidle')

  // Use pressSequentially so each keystroke fires real input events that
  // vee-validate definitely picks up (more reliable than .fill across
  // hydration boundaries).
  await loginInput.click()
  await loginInput.pressSequentially(login, { delay: 10 })
  await pwdInput.click()
  await pwdInput.pressSequentially(password, { delay: 10 })

  await expect(loginInput).toHaveValue(login)
  await expect(pwdInput).toHaveValue(password)
  // Reactive proof: button only enables when both refs are non-empty.
  await expect(submit).toBeEnabled()
}

test.describe('Login E2E', () => {
  test.skip(!PASSWORD, 'PASSWORD is missing in .env')

  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('logs in with valid credentials and lands on home', async ({ page }) => {
    await page.goto('/login')
    await fillCredentials(page, LOGIN, PASSWORD)

    await page.getByRole('button', { name: 'Войти' }).click()

    await page.waitForURL('**/', { timeout: 15_000 })
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('.login-card')).toHaveCount(0)
  })

  test('shows an error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await fillCredentials(page, 'wronguser', 'definitely-not-the-password')

    await page.getByRole('button', { name: 'Войти' }).click()

    const error = page.locator('.login-card__error')
    await expect(error).toBeVisible()
    await expect(error).toContainText('Неверный логин или пароль')
    await expect(page).toHaveURL(/\/login$/)
  })
})
