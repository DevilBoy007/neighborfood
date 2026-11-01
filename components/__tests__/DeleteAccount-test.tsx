import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import DeleteAccount from '@/app/DeleteAccount';
import firebaseService from '@/handlers/firebaseService';

jest.mock('@/hooks/useAppColors', () => ({
  useAppColors: () => jest.requireActual('@/constants/Colors').ThemePresets.default.colors,
}));
jest.mock('@/hooks/useSessionReset', () => ({ useSessionReset: () => jest.fn() }));
jest.mock('@/handlers/firebaseService', () => ({
  __esModule: true,
  default: { deleteAccount: jest.fn().mockRejectedValue(new Error('Incorrect password')) },
}));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), dismissAll: jest.fn(), replace: jest.fn() },
}));

describe('DeleteAccount screen', () => {
  it('stays disabled until the password and confirmation word are entered', async () => {
    await render(<DeleteAccount />);
    const button = screen.getByRole('button', { name: 'Permanently delete my account' });

    expect(button).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Password'), 'hunter22');
    expect(button).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(button).toBeEnabled();
    expect(firebaseService.deleteAccount).not.toHaveBeenCalled();
  });
});
