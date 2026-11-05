import type { BrowserContext, BrowserType, Page } from '@playwright/test'
import { KEPLR_EXTENSION_ID, type LiveEnv } from './env'
import { keplrUi } from './keplr-selectors'

const POPUP_URL_PREFIX = `chrome-extension://${KEPLR_EXTENSION_ID}/`
const OTHER_CHAIN_ID = /\bvna-[a-z]+-\d+\b/g

export type PopupExpectation = {
  chainId: string
  chainName: string
  messageTypes: string[]
}

export async function launchKeplrContext(
  env: LiveEnv,
  chromium: BrowserType,
  headless = false
): Promise<BrowserContext> {
  return chromium.launchPersistentContext(env.profileDir, {
    headless,
    baseURL: env.baseUrl,
    viewport: { width: 1440, height: 900 },
    args: [`--disable-extensions-except=${env.extensionPath}`, `--load-extension=${env.extensionPath}`],
  })
}

export async function assertKeplrReady(context: BrowserContext): Promise<void> {
  const page = await context.newPage()
  try {
    await page.goto(`${POPUP_URL_PREFIX}${keplrUi.popupPage}`, { timeout: 20_000 }).catch(() => {
      throw new Error(
        `Keplr is not loaded: ${POPUP_URL_PREFIX}${keplrUi.popupPage} does not open. Check E2E_KEPLR_EXTENSION_PATH points at the installed unpacked Keplr folder.`
      )
    })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2_000)
    const text = await page.locator('body').innerText()
    if (await page.locator(keplrUi.lockedField).first().isVisible()) {
      throw new Error(
        'Keplr is locked. Unlock it (open the profile headed and enter the password by hand), then rerun.'
      )
    }
    if (keplrUi.notSetUpText.test(text) || context.pages().some((open) => open.url().includes('register.html'))) {
      throw new Error(
        'Keplr is not set up in this profile. Run the setup project, import the test wallet and set the password by hand.'
      )
    }
  } finally {
    await page.close()
  }
}

export function popupProblem(text: string, expected: PopupExpectation): string | undefined {
  const others = [...new Set(text.match(OTHER_CHAIN_ID) ?? [])].filter((id) => id !== expected.chainId)
  if (others.length > 0) return `Keplr popup shows another chain (${others.join(', ')}), expected ${expected.chainId}`
  if (/mainnet/i.test(text)) return 'Keplr popup mentions mainnet'
  if (!text.includes(expected.chainId) && !text.includes(expected.chainName)) {
    return `Keplr popup does not show chain ${expected.chainId} (or ${expected.chainName})`
  }
  const missing = expected.messageTypes.filter(
    (type) => !text.includes(type) && !text.includes(type.split('.').at(-1) ?? type)
  )
  if (missing.length > 0) return `Keplr popup does not show the expected message type(s): ${missing.join(', ')}`
  return undefined
}

export function expectKeplrPopup(context: BrowserContext, timeoutMs = 90_000): Promise<Page> {
  const popup = new Promise<Page>((resolve, reject) => {
    const timer = setTimeout(() => {
      context.off('page', onPage)
      reject(
        new Error(`no Keplr popup appeared within ${timeoutMs}ms, is the wallet unlocked and the chain known to Keplr?`)
      )
    }, timeoutMs)
    const check = (page: Page) => {
      if (!page.url().startsWith(POPUP_URL_PREFIX)) return
      clearTimeout(timer)
      context.off('page', onPage)
      resolve(page)
    }
    const onPage = (page: Page) => {
      check(page)
      page.on('framenavigated', () => check(page))
    }
    context.on('page', onPage)
  })
  popup.catch(() => {})
  return popup
}

async function waitForApprove(popup: Page): Promise<void> {
  await popup
    .getByRole('button', { name: keplrUi.approve })
    .waitFor({ timeout: 30_000 })
    .catch(() => {
      throw new Error(
        'the Keplr popup shows no Approve button, it may be locked or its layout changed (see keplr-selectors.ts)'
      )
    })
}

async function expandDetails(popup: Page): Promise<void> {
  for (const name of keplrUi.expanders) {
    const button = popup.getByRole('button', { name }).first()
    if (await button.isVisible().catch(() => false)) await button.click().catch(() => {})
  }
}

export async function rejectInKeplr(popup: Page): Promise<void> {
  await popup.getByRole('button', { name: keplrUi.reject }).click({ timeout: 30_000 })
}

export async function approveInKeplr(popup: Page, expected: PopupExpectation): Promise<string> {
  await popup.waitForLoadState('domcontentloaded')
  await waitForApprove(popup)
  await expandDetails(popup)
  const text = await popup.locator('body').innerText()
  const problem = popupProblem(text, expected)
  if (problem) {
    await rejectInKeplr(popup).catch(() => {})
    throw new Error(`${problem}. Popup text was:\n${text}`)
  }
  await popup.getByRole('button', { name: keplrUi.approve }).click()
  return text
}

export function autoApproveSetupPopups(
  context: BrowserContext,
  expected: Omit<PopupExpectation, 'messageTypes'>
): () => void {
  const handle = async (page: Page) => {
    try {
      await page.waitForLoadState('domcontentloaded')
      await waitForApprove(page)
      const text = await page.locator('body').innerText()
      if (keplrUi.signingMarkers.test(text)) return
      const problem = popupProblem(text, { ...expected, messageTypes: [] })
      if (problem) {
        await rejectInKeplr(page)
        throw new Error(problem)
      }
      await page.getByRole('button', { name: keplrUi.approve }).click()
    } catch {}
  }
  const onPage = (page: Page) => {
    const check = () => {
      if (page.url().startsWith(POPUP_URL_PREFIX)) {
        page.off('framenavigated', check)
        void handle(page)
      }
    }
    check()
    page.on('framenavigated', check)
  }
  context.on('page', onPage)
  return () => context.off('page', onPage)
}
