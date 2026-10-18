import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'

async function open(page: Page) {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Good finds start here.' })).toBeVisible()
}
async function navigate(page: Page, name: string) {
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
  await page.getByRole('navigation').getByRole('button', { name, exact: true }).click()
}
async function uploadCsv(page: Page, text: string) {
  await page.getByRole('button', { name: 'Add listings', exact: true }).click()
  await page.getByRole('tab', { name: 'Import CSV' }).click()
  await page
    .getByLabel('CSV file', { exact: true })
    .setInputFiles({ name: 'market.csv', mimeType: 'text/csv', buffer: Buffer.from(text) })
}
async function bookmarkFirst(page: Page) {
  const card = page.locator('.listing-card').first()
  const model = (await card.locator('.listing-title').innerText()).trim()
  await card.getByRole('button', { name: `Save ${model} listing`, exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Saved to your watchlist')
  return model
}
async function noAxeViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  )
}

test('sample dashboard, chart controls, comparable detail, and calculator work', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await open(page)
  await expect(page.getByText('SAMPLE MARKET', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '90D', exact: true }).click()
  await expect(page.getByRole('button', { name: '90D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page
    .getByRole('combobox', { name: 'Chart model', exact: true })
    .selectOption('MacBook Air M1')
  await expect(page.locator('.chart-cohort')).toContainText('256 GB')
  await page.getByRole('button', { name: 'Take a closer look', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Your price context', { exact: true })).toBeVisible()
  await expect(dialog.getByText(/Illustrative listing/)).toBeVisible()
  const purchasePrice = Number(
    (await dialog.locator('.detail-price').innerText()).replace(/[^0-9]/g, ''),
  )
  await dialog.getByLabel('Expected resale (Rs)', { exact: true }).fill('150000')
  await dialog.getByLabel('Repairs (Rs)', { exact: true }).fill('5000')
  await dialog.getByLabel('Transport (Rs)', { exact: true }).fill('1000')
  await dialog.getByLabel('Selling fees (%)', { exact: true }).fill('2')
  await expect(dialog.locator('.profit-result')).toContainText(
    `Rs ${(150000 - purchasePrice - 5000 - 1000 - 3000).toLocaleString('en-PK')}`,
  )
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  expect(errors).toEqual([])
})

test('bookmarks persist across reloads and can be removed', async ({ page }) => {
  await open(page)
  const savedModel = await bookmarkFirst(page)
  await page.reload()
  await navigate(page, 'Watchlist')
  await expect(page.locator('.listing-card')).toHaveCount(1)
  await page.getByRole('button', { name: `Unsave ${savedModel} listing`, exact: true }).click()
  await expect(page.getByText('A little space for your next find.', { exact: true })).toBeVisible()
})

test('manual import creates a private listing, price observations, and a budget match', async ({
  page,
}) => {
  await open(page)
  await page.getByRole('button', { name: 'Add listings', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog
    .getByLabel('Listing title', { exact: false })
    .fill('ip13 128gb PTA approved good condition')
  await dialog.getByLabel('Asking price (PKR)', { exact: true }).fill('95k')
  await expect(dialog.locator('.parse-preview')).toContainText('iPhone 13')
  await dialog.getByRole('button', { name: 'Add listing', exact: true }).click()
  await expect(page.getByText('SAMPLE MARKET', { exact: true })).not.toBeVisible()
  await expect(page.locator('.listing-card')).toHaveCount(1)
  await expect(page.locator('.listing-card')).toContainText('Rs 95,000')
  await page.getByRole('button', { name: 'Inspect iPhone 13 listing', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Record a new asking price', { exact: true })
    .fill('90000')
  await page.getByRole('dialog').getByRole('button', { name: 'Record price', exact: true }).click()
  await expect(page.getByRole('dialog').locator('.detail-price')).toHaveText('Rs 90,000')
  await page.keyboard.press('Escape')
  await navigate(page, 'Price alerts')
  await page.getByRole('button', { name: 'Create alert', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Maximum asking price (Rs)', { exact: true })
    .fill('91000')
  await page.getByRole('dialog').getByRole('button', { name: 'Create alert', exact: true }).click()
  await expect(page.locator('.alert-rule')).toContainText('1 matches')
  await expect(page.locator('.alert-matches')).toContainText('Rs 90,000')
  await page.reload()
  await expect(page.locator('.alert-matches')).toContainText('Rs 90,000')
  await page.getByRole('switch', { name: 'Pause iPhone 13 alert', exact: true }).click()
  await expect(page.getByText('This alert is paused.', { exact: true })).toBeVisible()
})

test('CSV imports give a correct deal, separate PTA and parts, and preserve duplicate identities', async ({
  page,
}) => {
  await open(page)
  const csv = readFileSync('public/sample-listings.csv', 'utf8')
  await uploadCsv(page, csv)
  await expect(
    page.getByRole('dialog').getByText('8 ready to import', { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import 8 listings', exact: true })
    .click()
  await expect(page.locator('.listing-card')).toHaveCount(8)
  await expect(page.locator('.listing-card').filter({ hasText: 'Rs 98,000' })).toContainText(
    'Below market',
  )
  await expect(page.locator('.listing-card').filter({ hasText: 'Rs 25,000' })).toContainText(
    'Needs review',
  )
  await uploadCsv(page, csv)
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import 8 listings', exact: true })
    .click()
  await expect(page.locator('.listing-card')).toHaveCount(8)
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.getByRole('combobox', { name: 'PTA status', exact: true }).selectOption('non-pta')
  await expect(page.locator('.listing-card')).toHaveCount(1)
  await expect(page.locator('.listing-card')).toContainText('Rs 68,000')
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click()
  await page.getByLabel('Sort listings', { exact: true }).selectOption('low')
  await expect(page.locator('.listing-card').first()).toContainText('Rs 25,000')
  await page
    .getByRole('textbox', { name: 'Search by model, title or source', exact: true })
    .fill('not-a-real-model')
  await expect(page.getByText('Nothing quite matches. Yet.', { exact: true })).toBeVisible()
})

test('malformed CSV is reported without changing the existing workspace', async ({ page }) => {
  await open(page)
  await uploadCsv(page, 'model,value\niPhone,1000')
  await expect(page.getByRole('alert')).toContainText('CSV needs title and price columns')
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(page.getByText('SAMPLE MARKET', { exact: true })).toBeVisible()
})

test('backup, clear, and restore round-trip the private workspace', async ({ page }) => {
  await open(page)
  await uploadCsv(page, readFileSync('public/sample-listings.csv', 'utf8'))
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import 8 listings', exact: true })
    .click()
  await navigate(page, 'Your data')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export full backup', exact: true }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
  const backup = readFileSync(path!, 'utf8')
  expect(JSON.parse(backup).listings).toHaveLength(8)
  await page.getByRole('button', { name: 'Clear my workspace', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Clear workspace', exact: true })
    .click()
  await expect(page.locator('.data-counts').first()).toContainText('0')
  await page.getByLabel('Restore JSON backup', { exact: true }).setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  })
  await expect(page.getByRole('dialog')).toContainText('8 listings')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Restore backup', exact: true })
    .click()
  await navigate(page, 'All listings')
  await expect(page.locator('.listing-card')).toHaveCount(8)
})

test('keyboard focus stays inside the dialog and returns to its trigger', async ({ page }) => {
  await open(page)
  const trigger = page.getByRole('button', { name: 'Add listings', exact: true })
  await trigger.click()
  await expect(page.getByRole('button', { name: 'Close dialog', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Add listing', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Close dialog', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('all pages and key dialogs pass WCAG AA automated checks', async ({ page }) => {
  test.setTimeout(90000)
  await open(page)
  for (const name of [
    'Market overview',
    'All listings',
    'Watchlist',
    'Price alerts',
    'Your data',
  ]) {
    await navigate(page, name)
    await noAxeViolations(page)
  }
  await page.getByRole('button', { name: 'Add listings', exact: true }).click()
  await noAxeViolations(page)
  await page.getByRole('tab', { name: 'Import CSV', exact: true }).click()
  await noAxeViolations(page)
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await navigate(page, 'Price alerts')
  await page.getByRole('button', { name: 'Create alert', exact: true }).click()
  await noAxeViolations(page)
  await page.keyboard.press('Escape')
  await navigate(page, 'Market overview')
  await page.getByRole('button', { name: 'Take a closer look', exact: true }).click()
  await noAxeViolations(page)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'How Nearmint works', exact: true }).click()
  await noAxeViolations(page)
})

test('mobile layout has no horizontal overflow and navigation remains usable', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await open(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await navigate(page, 'All listings')
  await expect(page.getByRole('heading', { name: 'The local lineup.', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await noAxeViolations(page)
  await page.getByRole('button', { name: 'Add listings', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await noAxeViolations(page)
})

test('installed app shell and saved data are usable offline', async ({ page, context }) => {
  await open(page)
  await bookmarkFirst(page)
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      )
    return registration.active?.state
  })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Offline', { exact: true })).toBeVisible()
  await navigate(page, 'Watchlist')
  await expect(page.locator('.listing-card')).toHaveCount(1)
  await context.setOffline(false)
})

test('expanded market supports brand browsing, pagination, and price history in multiple cities', async ({
  page,
}) => {
  await open(page)
  await expect(page.locator('.catalog-summary')).toContainText('18 brands')
  await page
    .getByRole('combobox', { name: 'Chart model', exact: true })
    .selectOption('Redmi Note 13 4G')
  await expect(page.getByRole('combobox', { name: 'Chart model', exact: true })).toHaveValue(
    'Redmi Note 13 4G',
  )
  await expect(page.locator('.chart-cohort')).toContainText('128 GB')
  await navigate(page, 'All listings')
  await page.getByRole('combobox', { name: 'Brand', exact: true }).selectOption('Infinix')
  await page.getByRole('button', { name: 'Phones', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Brand', exact: true })).toHaveValue('Infinix')
  await expect(page.locator('.listing-card')).toHaveCount(18)
  for (const title of await page.locator('.listing-title').allTextContents())
    expect(title).toMatch(/^Infinix /)
  await page.getByRole('button', { name: 'Show more listings', exact: true }).click()
  await expect(page.locator('.listing-card')).toHaveCount(36)
  await page.getByRole('combobox', { name: 'Market city', exact: true }).selectOption('Karachi')
  await expect(page.locator('.listing-location').first()).toContainText('Karachi')
  await expect(page.locator('.listing-card')).toHaveCount(18)
  await page.getByRole('combobox', { name: 'Brand', exact: true }).selectOption('Redmi')
  await page
    .getByRole('textbox', { name: 'Search by model, title or source', exact: true })
    .fill('note13')
  await expect(page.locator('.listing-card').first()).toBeVisible()
  for (const title of await page.locator('.listing-title').allTextContents())
    expect(title).toMatch(/^Redmi Note 13/)
})

test('alerts can select new budget-phone brands from the full catalog', async ({ page }) => {
  await open(page)
  await navigate(page, 'Price alerts')
  await page.getByRole('button', { name: 'Create alert', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox', { name: 'Brand', exact: true }).selectOption('Tecno')
  await dialog.getByRole('combobox', { name: 'Model', exact: true }).selectOption('Tecno Camon 30')
  await dialog.getByRole('combobox', { name: 'Storage', exact: true }).selectOption('256')
  await dialog
    .getByRole('combobox', { name: 'Minimum discount below median', exact: true })
    .selectOption('12')
  await dialog.getByRole('button', { name: 'Create alert', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.alert-rule')).toContainText('Tecno Camon 30')
  await expect(page.locator('.alert-matches')).toContainText('Tecno Camon 30')
  await page.reload()
  await expect(page.locator('.alert-matches')).toContainText('Tecno Camon 30')
})
