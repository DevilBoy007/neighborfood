// Darker shades so the white status label stays readable (>= 4.5:1).
const STATUS = {
  pending: '#b45309',
  trade: '#a21caf',
  preparing: '#7b1fa2',
  ready: '#00739a',
  delivering: '#8e24aa',
  done: '#2e7d32',
  danger: '#c62828',
  neutral: '#4f6549',
};

export const useOrderStatus = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return STATUS.pending;
      case 'trade':
        return STATUS.trade;
      case 'preparing':
        return STATUS.preparing;
      case 'ready':
        return STATUS.ready;
      case 'in-delivery':
        return STATUS.delivering;
      case 'completed':
        return STATUS.done;
      case 'cancelled':
      case 'payment_failed':
        return STATUS.danger;
      default:
        return STATUS.neutral;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'trade':
        return 'Trade Offer';
      case 'preparing':
        return 'Being Prepared';
      case 'ready':
        return 'Ready for Pickup';
      case 'in-delivery':
        return 'Out for Delivery';
      case 'completed':
        return 'Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      case 'payment_failed':
        return 'Payment Failed';
      default:
        return status;
    }
  };

  const getStatusOptions = (status: string, shopOwnerView: boolean = false) => {
    if (shopOwnerView) {
      switch (status) {
        case 'pending':
          return [
            { label: 'Accept', targetStatus: 'preparing', color: STATUS.ready },
            { label: 'Deny', targetStatus: 'cancelled', color: STATUS.danger },
          ];
        case 'trade':
          return [
            { label: 'Accept', targetStatus: 'preparing', color: STATUS.ready },
            { label: 'Counteroffer', targetStatus: 'counteroffer', color: STATUS.trade },
            { label: 'Deny', targetStatus: 'cancelled', color: STATUS.danger },
          ];
        case 'preparing':
          return [
            { label: 'Ready', targetStatus: 'ready', color: STATUS.ready },
            { label: 'Delivering', targetStatus: 'in-delivery', color: STATUS.delivering },
            { label: 'Cancel', targetStatus: 'cancelled', color: STATUS.danger },
          ];
        case 'ready':
          return [
            { label: 'Complete', targetStatus: 'completed', color: STATUS.done },
            { label: 'Cancel', targetStatus: 'cancelled', color: STATUS.danger },
          ];
        case 'in-delivery':
          return [
            { label: 'Complete', targetStatus: 'completed', color: STATUS.done },
            { label: 'Cancel', targetStatus: 'cancelled', color: STATUS.danger },
          ];
        default:
          return [];
      }
    } else {
      // Customer view
      switch (status) {
        case 'pending':
          return [{ label: 'Cancel', targetStatus: 'cancelled', color: STATUS.danger }];
        case 'trade':
          return [
            { label: 'Update Offer', targetStatus: 'update_trade', color: STATUS.trade },
            { label: 'Buy Instead', targetStatus: 'buy_instead', color: STATUS.ready },
            { label: 'Revoke', targetStatus: 'cancelled', color: STATUS.danger },
          ];
        case 'preparing':
          return [{ label: 'Contact', targetStatus: 'contact', color: STATUS.preparing }];
        case 'ready':
        case 'in-delivery':
          return [
            { label: 'Received', targetStatus: 'completed', color: STATUS.done },
            { label: 'Contact', targetStatus: 'contact', color: STATUS.ready },
          ];
        default:
          return [];
      }
    }
  };

  const buildStatusButtons = (
    status: string,
    shopOwnerView: boolean,
    onStatusChange?: (newStatus: string) => void
  ) => {
    const options = getStatusOptions(status, shopOwnerView);

    return options.map((option, index) => ({
      key: `${option.targetStatus}-${index}`,
      label: option.label,
      targetStatus: option.targetStatus,
      color: option.color,
      onPress: () => onStatusChange?.(option.targetStatus),
    }));
  };

  return {
    getStatusColor,
    getStatusText,
    getStatusOptions,
    buildStatusButtons,
  };
};
