import React from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkArea({
  children,
  noScrollView = false,
}: {
  children: React.ReactNode;
  noScrollView?: boolean;
}) {
  if (noScrollView) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.sav}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.sav}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode='interactive'
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingBottom: 40,
  },
  keyboard: {
    flex: 1,
  },
});
