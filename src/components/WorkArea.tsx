import React from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkArea({
  children,
  noScrollView = false,
}: {
  children: React.ReactNode;
  noScrollView?: boolean;
}) {
  const insets = useSafeAreaInsets();

  if (noScrollView) {
    return (
      <View style={[styles.sav, { paddingBottom: insets.bottom }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.sav}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
          keyboardDismissMode='interactive'
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  sav: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    // paddingBottom removido daqui, agora é dinâmico
  },
  keyboard: {
    flex: 1,
  },
});
