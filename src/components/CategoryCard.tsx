import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryCardProps {
  category: {
    id: number;
    name: string;
    description?: string;
    products_count?: number;
  };
  onPress?: (category: CategoryCardProps['category']) => void;
}

export default function CategoryCard({ category, onPress }: CategoryCardProps) {
  const handlePress = () => {
    onPress?.(category);
  };

  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="albums" size={20} color="#3b82f6" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {category.name}
          </Text>
          {category.description && (
            <Text style={styles.categoryDescription} numberOfLines={1}>
              {category.description}
            </Text>
          )}
        </View>
        {category.products_count !== undefined && (
          <View style={styles.badge}>
            <Ionicons name="cube" size={12} color="#3b82f6" />
            <Text style={styles.badgeText}>{category.products_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryDescription: {
    fontSize: 11,
    color: '#64748b',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
