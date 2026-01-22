export const useOrderStatus = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'preparing':
        return '#9C27B0';
      case 'ready':
        return '#00bfff';
      case 'in-delivery':
        return 'orchid';
      case 'delivered':
        return '#4CAF50';
      default:
        return '#4f6549ff';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
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
      default:
        return status;
    }
  };

  const getStatusOptions = (status: string, shopOwnerView: boolean = false) => {
    console.log('SHOP OWNER VIEW:', shopOwnerView);
    if (shopOwnerView) {
      switch (status) {
        case 'pending':
          return [
            { label: 'Accept', targetStatus: 'preparing', color: '#00bfff' },
            { label: 'Deny', targetStatus: 'cancelled', color: '#f44336' },
          ];
        case 'preparing':
          return [
            { label: 'Ready', targetStatus: 'ready', color: '#00bfff' },
            { label: 'Delivering', targetStatus: 'in-delivery', color: 'orchid' },
            { label: 'Cancel', targetStatus: 'cancelled', color: '#f44336' },
          ];
        case 'ready':
          return [
            { label: 'Complete', targetStatus: 'completed', color: '#00bfff' },
            { label: 'Cancel', targetStatus: 'cancelled', color: '#f44336' },
          ];
        case 'in-delivery':
          return [{ label: 'Complete', targetStatus: 'completed', color: '#00bfff' }];
        default:
          return [];
      }
    } else {
      // Customer view
      switch (status) {
        case 'pending':
          return [{ label: 'Cancel', targetStatus: 'cancelled', color: '#f44336' }];
        case 'preparing':
          return [{ label: 'Cancel', targetStatus: 'cancelled', color: '#f44336' }];
        case 'ready':
          return [{ label: 'Contact', targetStatus: 'ready', color: '#00bfff' }];
        case 'in-delivery':
          return [{ label: 'Contact', targetStatus: 'in-delivery', color: 'orchid' }];
        case 'completed':
          return [{ label: 'Complete', targetStatus: 'completed', color: '#4CAF50' }];
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
