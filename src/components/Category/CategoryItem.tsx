import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Category {
  id: number;
  name: string;
  description?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export default function CategoryItem({ category }: CategoryItemProps) {
  const isActive = category.active === 1;

  return (
    <TouchableOpacity
      style={[styles.categoryItem, !isActive && styles.categoryItemInactive]}
      activeOpacity={0.7}
      onPress={() => router.push(`/categories/${category.id}/edit`)}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, !isActive && styles.inactiveText]}>
            {category.name}
          </Text>
          {category.description && (
            <Text
              style={[
                styles.categoryDescription,
                !isActive && styles.inactiveText,
              ]}
            >
              {category.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryItemInactive: {
    opacity: 0.7,
    backgroundColor: '#f8fafc',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748b',
    paddingTop: 4,
  },
  inactiveText: {
    color: '#94a3b8',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  toggleButton: {
    backgroundColor: '#f0fdf4',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
});
