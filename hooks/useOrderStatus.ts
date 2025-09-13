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
            default:
                return status;
        }
    };

    return {
        getStatusColor,
        getStatusText
    };
};