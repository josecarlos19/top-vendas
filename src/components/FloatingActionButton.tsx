import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ActionButtonProps {
  route: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  onPress?: () => void;
}

export function ActionButton({
  route,
  label,
  icon = 'add-circle',
  iconSize = 24,
  onPress,
}: ActionButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(route as any);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons name={icon} size={iconSize} color="#ffffff" />
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
export const FloatingActionButton = ActionButton;
