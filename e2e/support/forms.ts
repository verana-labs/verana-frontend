import type { Page } from '@playwright/test'

const sibling = (page: Page, label: string, tag: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator(`xpath=following-sibling::${tag}[1]`)

export const labelInput = (page: Page, label: string) => sibling(page, label, 'input')
export const labelSelect = (page: Page, label: string) => sibling(page, label, 'select')
export const labelTextarea = (page: Page, label: string) => sibling(page, label, 'textarea')
