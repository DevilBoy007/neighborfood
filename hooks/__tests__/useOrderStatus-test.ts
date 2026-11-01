import { useOrderStatus } from '@/hooks/useOrderStatus';

// Mirrors SELLER_TRANSITIONS / BUYER_TRANSITIONS in functions/src/index.ts.
const SELLER: Record<string, string[]> = {
  pending: ['preparing', 'cancelled'],
  trade: ['preparing', 'cancelled'],
  preparing: ['ready', 'in-delivery', 'cancelled'],
  ready: ['in-delivery', 'completed', 'cancelled'],
  'in-delivery': ['completed', 'cancelled'],
};
const BUYER: Record<string, string[]> = {
  pending: ['cancelled'],
  trade: ['cancelled'],
  ready: ['completed'],
  'in-delivery': ['completed'],
};
// Buttons that navigate instead of changing status.
const NAVIGATION_ACTIONS = ['contact', 'counteroffer', 'update_trade', 'buy_instead'];

const STATUSES = [
  'pending',
  'trade',
  'preparing',
  'ready',
  'in-delivery',
  'completed',
  'cancelled',
];

describe('useOrderStatus', () => {
  const { getStatusOptions, getStatusColor, getStatusText } = useOrderStatus();

  it.each(STATUSES)('only offers sellers transitions the server allows from %s', (status) => {
    for (const option of getStatusOptions(status, true)) {
      if (NAVIGATION_ACTIONS.includes(option.targetStatus)) continue;
      expect(SELLER[status]).toContain(option.targetStatus);
    }
  });

  it.each(STATUSES)('only offers buyers transitions the server allows from %s', (status) => {
    for (const option of getStatusOptions(status, false)) {
      if (NAVIGATION_ACTIONS.includes(option.targetStatus)) continue;
      expect(BUYER[status]).toContain(option.targetStatus);
    }
  });

  it('does not offer the buyer a cancel button once the seller has accepted', () => {
    const labels = getStatusOptions('preparing', false).map((o) => o.label);
    expect(labels).not.toContain('Cancel');
  });

  it('has a label and color for every status', () => {
    for (const status of STATUSES) {
      expect(getStatusText(status)).toBeTruthy();
      expect(getStatusColor(status)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
