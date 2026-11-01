import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ReportProvider, useReport } from '@/components/ReportProvider';
import firebaseService from '@/handlers/firebaseService';

jest.mock('@/hooks/useAppColors', () => ({
  useAppColors: () => jest.requireActual('@/constants/Colors').ThemePresets.default.colors,
}));
jest.mock('@/handlers/firebaseService', () => ({
  __esModule: true,
  default: { submitReport: jest.fn().mockResolvedValue({ reportId: 'r1' }) },
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));

function ReportShopButton() {
  const report = useReport();
  return (
    <TouchableOpacity
      onPress={() => report({ targetType: 'shop', targetId: 'shop1', label: 'Farm Stand' })}
    >
      <Text>open report</Text>
    </TouchableOpacity>
  );
}

describe('ReportProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submits the selected reason for the reported content', async () => {
    await render(
      <ReportProvider>
        <ReportShopButton />
      </ReportProvider>
    );

    await fireEvent.press(screen.getByText('open report'));
    expect(screen.getByText('Report Farm Stand')).toBeTruthy();

    await fireEvent.press(screen.getByText('Submit report'));
    expect(firebaseService.submitReport).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Scam or fraud'));
    await fireEvent.changeText(screen.getByPlaceholderText('Add details (optional)'), 'fake eggs');
    await fireEvent.press(screen.getByText('Submit report'));

    expect(firebaseService.submitReport).toHaveBeenCalledWith({
      targetType: 'shop',
      targetId: 'shop1',
      reason: 'scam',
      details: 'fake eggs',
      alsoBlock: false,
    });
  });
});
