export const keplrUi = {
  approve: /^approve$/i,
  reject: /^reject$/i,
  expanders: [/^(show )?(details?|data|more)$/i, /^view (details?|data)$/i],
  lockedField: 'input[type="password"]',
  notSetUpText: /create a new wallet|import an existing wallet|recovery phrase|get started/i,
  signingMarkers: /\bfee\b|\bmemo\b|\bsign(ing)?\b/i,
  popupPage: 'popup.html',
} as const
