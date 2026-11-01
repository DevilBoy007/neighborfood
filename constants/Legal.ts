import * as WebBrowser from 'expo-web-browser';

const LEGAL_BASE_URL = 'https://neighborfood.store/legal';

export const LegalDocuments = {
  terms: { title: 'Terms of Service', url: `${LEGAL_BASE_URL}/terms.html` },
  privacy: { title: 'Privacy Policy', url: `${LEGAL_BASE_URL}/privacy.html` },
  guidelines: {
    title: 'Community Guidelines',
    url: `${LEGAL_BASE_URL}/community-guidelines.html`,
  },
} as const;

export type LegalDocument = keyof typeof LegalDocuments;

export const openLegalDocument = (document: LegalDocument) =>
  WebBrowser.openBrowserAsync(LegalDocuments[document].url);
