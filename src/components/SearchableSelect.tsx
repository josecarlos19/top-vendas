import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SearchableSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  metadata?: {
    subtitle?: string;
    badge?: {
      text: string;
      variant: 'success' | 'warning' | 'danger' | 'info';
    };
    icon?: string;
  };
}

interface SearchableSelectProps {
  label?: string;
  selectedValue: string | number | undefined;
  onValueChange: (value: string | number) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  enabled?: boolean;
}

export default function SearchableSelect({
  label,
  selectedValue,
  onValueChange,
  options,
  placeholder = 'Selecione...',
  enabled = true,
}: SearchableSelectProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === selectedValue);
    return selected ? selected.label : placeholder;
  }, [selectedValue, options, placeholder]);

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) {
      return options;
    }

    const searchLower = searchText.toLowerCase().trim();
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    );
  }, [options, searchText]);

  const handleOpenModal = () => {
    if (enabled) {
      setSearchText('');
      setIsModalVisible(true);
    }
  };

  const handleSelectOption = (value: string | number) => {
    if (value === selectedValue) {
      onValueChange(undefined as any);
    } else {
      onValueChange(value);
    }
    setIsModalVisible(false);
    setSearchText('');
  };

  const handleClearSelection = () => {
    onValueChange(undefined as any);
    setIsModalVisible(false);
    setSearchText('');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSearchText('');
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  const renderOption = ({ item }: { item: SearchableSelectOption }) => {
    const isSelected = item.value === selectedValue;
    const isDisabled = item.disabled || false;

    const getBadgeStyle = (variant: string) => {
      switch (variant) {
        case 'success':
          return { bg: '#dcfce7', text: '#16a34a', border: '#86efac' };
        case 'warning':
          return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
        case 'danger':
          return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
        case 'info':
          return { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' };
        default:
          return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.optionItemSelected,
          isDisabled && styles.optionItemDisabled,
        ]}
        onPress={() => !isDisabled && handleSelectOption(item.value)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionTextContainer}>
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
                isDisabled && styles.optionTextDisabled,
              ]}
            >
              {item.label}
            </Text>
            {item.metadata?.subtitle && (
              <Text style={styles.optionSubtitle}>
                {item.metadata.subtitle}
              </Text>
            )}
          </View>

          <View style={styles.optionRight}>
            {item.metadata?.badge && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: getBadgeStyle(item.metadata.badge.variant).bg,
                    borderColor: getBadgeStyle(item.metadata.badge.variant).border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: getBadgeStyle(item.metadata.badge.variant).text },
                  ]}
                >
                  {item.metadata.badge.text}
                </Text>
              </View>
            )}

            {isSelected && !isDisabled && (
              <Ionicons name="checkmark" size={20} color="#3b82f6" />
            )}
            {isDisabled && (
              <Ionicons name="ban-outline" size={18} color="#ef4444" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color="#cbd5e1" />
      <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
      <Text style={styles.emptySubtext}>
        Tente buscar com outros termos
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, label ? styles.containerWithLabel : null]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.selectButton,
          !enabled && styles.selectButtonDisabled,
          selectedValue ? styles.selectButtonFilled : null,
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
        disabled={!enabled}
      >
        <Text
          style={[
            styles.selectButtonText,
            !selectedValue && styles.selectButtonTextPlaceholder,
            !enabled && styles.selectButtonTextDisabled,
          ]}
        >
          {selectedLabel}
        </Text>
        <View style={styles.iconWrapper}>
          <Ionicons
            name={isModalVisible ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={enabled ? '#64748b' : '#cbd5e1'}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Selecionar'}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Clear Selection Button */}
            {selectedValue !== undefined && (
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={handleClearSelection}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={styles.clearSelectionText}>Limpar seleção</Text>
              </TouchableOpacity>
            )}

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color="#64748b"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar..."
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={false}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              renderItem={renderOption}
              keyExtractor={(item) => item.value.toString()}
              contentContainerStyle={styles.optionsList}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
            />

            {/* Results Count */}
            {filteredOptions.length > 0 && (
              <View style={styles.modalFooter}>
                <Text style={styles.resultCount}>
                  {filteredOptions.length} {filteredOptions.length === 1 ? 'opção' : 'opções'}
                  {searchText && ' encontrada(s)'}
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  containerWithLabel: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  selectButtonFilled: {
    borderColor: '#cbd5e1',
  },
  selectButtonDisabled: {
    backgroundColor: '#f8fafc',
    opacity: 0.6,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    marginRight: 8,
    lineHeight: 20,
  },
  iconWrapper: {
    paddingTop: 2,
  },
  selectButtonTextPlaceholder: {
    color: '#94a3b8',
  },
  selectButtonTextDisabled: {
    color: '#cbd5e1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    padding: 0,
  },
  optionsList: {
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 44,
  },
  optionItemSelected: {
    backgroundColor: '#eff6ff',
  },
  optionItemDisabled: {
    backgroundColor: '#fef2f2',
    opacity: 0.7,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    lineHeight: 20,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 2,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  optionTextDisabled: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  resultCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearSelectionText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 6,
  },
});
