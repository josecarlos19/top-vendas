import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomerCardProps {
  customer: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
    city?: string;
  };
  onPress?: (customer: CustomerCardProps['customer']) => void;
}

export default function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const handlePress = () => {
    onPress?.(customer);
  };

  return (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.customerHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={16} color="#3b82f6" />
        </View>
        <View style={styles.customerHeaderContent}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customer.name}
          </Text>
        </View>
      </View>

      <View style={styles.customerContent}>
        {(customer.email || customer.phone) && (
          <View style={styles.contactRow}>
            {customer.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={11} color="#64748b" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {customer.email}
                </Text>
              </View>
            )}
            {customer.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={11} color="#64748b" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {customer.phone}
                </Text>
              </View>
            )}
          </View>
        )}

        {(customer.document || customer.city) && (
          <View style={styles.detailsRow}>
            {customer.document && (
              <View style={styles.detailItem}>
                <Ionicons name="card" size={10} color="#94a3b8" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {customer.document}
                </Text>
              </View>
            )}
            {customer.city && (
              <View style={styles.detailItem}>
                <Ionicons name="location" size={10} color="#94a3b8" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {customer.city}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  customerHeaderContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  customerContent: {
    gap: 5,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  contactText: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  detailText: {
    fontSize: 10,
    color: '#94a3b8',
    flex: 1,
  },
});
