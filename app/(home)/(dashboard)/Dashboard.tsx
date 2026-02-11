import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';
import { selectAllOrders } from '@/store/slices/orderSlice';
import { useAppColors } from '@/hooks/useAppColors';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const router = useRouter();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const allOrders = useAppSelector(selectAllOrders);
  const placedOrders = useAppSelector((state) => state.order.placedOrders);
  const receivedOrders = useAppSelector((state) => state.order.receivedOrders);
  const orderHistory = useAppSelector((state) => state.order.orderHistory);
  const userData = useAppSelector((state) => state.user.userData);

  // Calculate metrics
  const metrics = useMemo(() => {
    // Order counts
    const totalPlaced = placedOrders.length;
    const totalReceived = receivedOrders.length;
    const totalHistory = orderHistory.length;
    const totalOrders = allOrders.length;

    // Revenue calculations
    const completedOrders = allOrders.filter((order) => order.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

    // Active orders (pending, preparing, ready, in-delivery)
    const activeOrders = allOrders.filter(
      (order) =>
        order.status === 'pending' ||
        order.status === 'preparing' ||
        order.status === 'ready' ||
        order.status === 'in-delivery'
    );
    const pendingRevenue = activeOrders.reduce((sum, order) => sum + order.total, 0);

    // Cancelled orders
    const cancelledOrders = allOrders.filter((order) => order.status === 'cancelled');
    const cancelledCount = cancelledOrders.length;
    const cancelledValue = cancelledOrders.reduce((sum, order) => sum + order.total, 0);

    // Order status breakdown
    const ordersByStatus = {
      pending: allOrders.filter((o) => o.status === 'pending').length,
      preparing: allOrders.filter((o) => o.status === 'preparing').length,
      ready: allOrders.filter((o) => o.status === 'ready').length,
      'in-delivery': allOrders.filter((o) => o.status === 'in-delivery').length,
      completed: completedOrders.length,
      cancelled: cancelledCount,
    };

    // Average order value
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Recent order trend (last 7 days)
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentOrders = allOrders.filter((order) => order.createdAt.seconds * 1000 > sevenDaysAgo);

    // Orders by day (last 7 days)
    const ordersByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime() / 1000;
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime() / 1000;
      const count = allOrders.filter(
        (order) => order.createdAt.seconds >= dayStart && order.createdAt.seconds <= dayEnd
      ).length;
      return {
        day: new Date(now - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        count,
      };
    }).reverse();

    return {
      totalPlaced,
      totalReceived,
      totalHistory,
      totalOrders,
      totalRevenue,
      pendingRevenue,
      cancelledCount,
      cancelledValue,
      ordersByStatus,
      avgOrderValue,
      recentOrders: recentOrders.length,
      ordersByDay,
      activeOrders: activeOrders.length,
    };
  }, [allOrders, placedOrders, receivedOrders, orderHistory]);

  // Prepare chart data
  const statusPieData = useMemo(() => {
    return Object.entries(metrics.ordersByStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count], index) => ({
        name: status,
        count: count,
        color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#f44336'][index % 6],
        legendFontColor: colors.text,
        legendFontSize: Platform.OS === 'web' ? 14 : 12,
      }));
  }, [metrics.ordersByStatus, colors.text]);

  const orderTrendData = useMemo(() => {
    return {
      labels: metrics.ordersByDay.map((d) => d.day),
      datasets: [
        {
          data: metrics.ordersByDay.map((d) => d.count),
        },
      ],
    };
  }, [metrics.ordersByDay]);

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontFamily: Platform.OS === 'web' ? 'TextMeOne' : undefined,
    },
  };

  const MetricTile = ({
    title,
    value,
    subtitle,
    color,
    onPress,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    onPress?: () => void;
  }) => {
    const TileWrapper = onPress ? TouchableOpacity : View;
    return (
      <TileWrapper
        style={[styles.metricTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <Text style={[styles.metricTitle, { color: colors.textMuted }]}>{title}</Text>
        <Text style={[styles.metricValue, { color: color || colors.text }]}>{value}</Text>
        {subtitle && (
          <Text style={[styles.metricSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        )}
      </TileWrapper>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS !== 'web' && (
        <View style={{ height: insets.top, backgroundColor: colors.navBackground }} />
      )}
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.navBackground, borderBottomColor: colors.border },
          Platform.OS !== 'web' && styles.headerMobile,
        ]}
      >
        <View>
          <Text style={[styles.title, { color: colors.buttonText }]}>dashboard</Text>
          {userData && (
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Welcome back, {userData.first}!
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={Platform.OS === 'web' ? 40 : 28}
            color={colors.icon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Orders Overview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Orders Overview</Text>
          <View style={styles.metricsRow}>
            <MetricTile title="Total Orders" value={metrics.totalOrders} subtitle="All time" />
            <MetricTile
              title="Active Orders"
              value={metrics.activeOrders}
              subtitle="In progress"
              color={colors.primary || '#4CAF50'}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricTile
              title="Placed Orders"
              value={metrics.totalPlaced}
              subtitle="Orders you placed"
              onPress={() => router.push('/(home)/(orders)')}
            />
            <MetricTile
              title="Received Orders"
              value={metrics.totalReceived}
              subtitle="Orders received"
              onPress={() => router.push('/(home)/(orders)')}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricTile
              title="Completed"
              value={metrics.ordersByStatus.completed}
              subtitle="Successfully delivered"
              color="#4CAF50"
            />
            <MetricTile
              title="Cancelled"
              value={metrics.cancelledCount}
              subtitle={`$${metrics.cancelledValue.toFixed(2)} lost`}
              color="#f44336"
            />
          </View>
        </View>

        {/* Revenue Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Metrics</Text>
          <View style={styles.metricsRow}>
            <MetricTile
              title="Total Revenue"
              value={`$${metrics.totalRevenue.toFixed(2)}`}
              subtitle={`From ${metrics.ordersByStatus.completed} completed orders`}
              color="#4CAF50"
            />
            <MetricTile
              title="Pending Revenue"
              value={`$${metrics.pendingRevenue.toFixed(2)}`}
              subtitle={`From ${metrics.activeOrders} active orders`}
              color="#FF9800"
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricTile
              title="Avg Order Value"
              value={`$${metrics.avgOrderValue.toFixed(2)}`}
              subtitle="Per completed order"
            />
            <MetricTile title="Recent Orders" value={metrics.recentOrders} subtitle="Last 7 days" />
          </View>
        </View>

        {/* Charts Section */}
        {statusPieData.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Order Status Distribution
            </Text>
            <View
              style={[
                styles.chartContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <PieChart
                data={statusPieData}
                width={Platform.OS === 'web' ? 400 : width - 80}
                height={220}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Order Trend Chart */}
        {metrics.ordersByDay.some((d) => d.count > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Orders Last 7 Days</Text>
            <View
              style={[
                styles.chartContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <BarChart
                data={orderTrendData}
                width={Platform.OS === 'web' ? 500 : width - 80}
                height={220}
                chartConfig={chartConfig}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                showValuesOnTopOfBars
                style={{
                  borderRadius: 16,
                }}
              />
            </View>
          </View>
        )}

        {/* Empty State */}
        {metrics.totalOrders === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              No orders yet. Start selling or buying to see your dashboard metrics!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS !== 'web' ? 16 : 12,
    borderBottomWidth: 1,
  },
  headerMobile: {
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: 8,
    marginLeft: 12,
  },
  title: {
    fontSize: Platform.select({ ios: 28, android: 28, web: 48 }),
    fontFamily: 'TitanOne',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Platform.select({ ios: 14, android: 14, web: 20 }),
    fontFamily: 'TextMeOne',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        width: '100%',
        marginHorizontal: 'auto',
      },
    }),
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: Platform.select({ ios: 20, android: 20, web: 32 }),
    fontFamily: 'TitanOne',
    marginBottom: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    ...Platform.select({
      web: {
        flexWrap: 'wrap',
      },
    }),
  },
  metricTile: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'web' ? 120 : 100,
    ...Platform.select({
      web: {
        minWidth: 200,
        padding: 25,
      },
    }),
  },
  metricTitle: {
    fontSize: Platform.select({ ios: 12, android: 12, web: 18 }),
    fontFamily: 'TextMeOne',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: Platform.select({ ios: 24, android: 24, web: 36 }),
    fontFamily: 'TitanOne',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: Platform.select({ ios: 10, android: 10, web: 14 }),
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 15,
    alignItems: 'center',
    ...Platform.select({
      web: {
        padding: 30,
      },
    }),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: Platform.select({ ios: 16, android: 16, web: 20 }),
    textAlign: 'center',
    fontFamily: 'TextMeOne',
  },
});

export default Dashboard;
