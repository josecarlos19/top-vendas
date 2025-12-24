import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface FloatingActionButtonProps {
  route: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  backgroundColor?: string;
  bottom?: number;
  right?: number;
  activeOpacity?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function FloatingActionButton({
  route,
  icon = 'add',
  iconSize = 24,
  iconColor = '#ffffff',
  backgroundColor = '#FF6B35',
  bottom = 20,
  right = 20,
  activeOpacity = 0.8,
  onPress,
  style,
}: FloatingActionButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(route as any);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor,
          bottom,
          right,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={activeOpacity}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
