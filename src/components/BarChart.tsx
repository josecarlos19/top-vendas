import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BarChartData {
  date: string;
  totalSales: number;
}

interface BarChartProps {
  data: BarChartData[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxSales = Math.max(...data.map(d => d.totalSales), 1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const height = maxSales > 0 ? (item.totalSales / maxSales) * 120 : 0;
          const hasValue = item.totalSales > 0;

          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                {hasValue && (
                  <Text style={styles.valueText}>{item.totalSales}</Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: hasValue ? Math.max(height, 20) : 8,
                      backgroundColor: hasValue ? '#667eea' : '#e2e8f0',
                    },
                  ]}
                />
              </View>
              <Text style={styles.label}>{formatDate(item.date)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#667eea' }]} />
          <Text style={styles.legendText}>Vendas realizadas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 16,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 4,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default BarChart;
