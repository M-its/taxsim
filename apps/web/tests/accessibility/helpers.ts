import { expect, type Page } from '@playwright/test'

export const A11Y_USER_ID = '00000000-0000-4000-8000-000000000002'
export const A11Y_EMAIL = 'a11y@taxsim.test'
export const A11Y_PASSWORD = 'A11yTest!2026'
export const A11Y_API_URL = process.env.A11Y_API_URL ?? 'http://localhost:3334'

export async function authenticate(page: Page, destination = '/dashboard'): Promise<void> {
  await page.addInitScript((userId) => {
    window.localStorage.setItem(`taxsim:onboarding:${encodeURIComponent(userId)}:completed:v1`, 'true')
  }, A11Y_USER_ID)

  const response = await page.request.post(`${A11Y_API_URL}/auth/login`, {
    data: { email: A11Y_EMAIL, password: A11Y_PASSWORD },
  })
  expect(response.ok(), await response.text()).toBeTruthy()

  await page.goto(destination)
  await expect(page).toHaveURL(new RegExp(`${destination.replace('/', '\\/')}$`))
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  if (destination === '/dashboard') {
    await expect(page.getByText('Dados do dashboard carregados.')).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Composição Tributária' })).toBeVisible()
  }
}

export function projectSuffix(projectName: string): string {
  return projectName === 'chromium-mobile' ? 'mobile' : 'desktop'
}
