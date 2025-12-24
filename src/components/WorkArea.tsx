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
      <SafeAreaView edges={['bottom']} style={[styles.sav]}>
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={['bottom']} style={[styles.sav]}>
      <KeyboardAvoidingView style={[styles.keyboard]} behavior={'padding'}>
        <ScrollView
          style={[styles.scroll]}
          keyboardDismissMode='interactive'
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sav: {
    flex: 1,
  },
  scroll: {
    overflow: 'visible',
  },
  keyboard: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
});
