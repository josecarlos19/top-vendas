import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [userName, setUserName] = useState('Usuário');
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userName').then(name => {
      if (name) setUserName(name);
    });
  }, []);

  const startEditing = () => {
    setTempName(userName);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setTempName('');
  };

  const saveName = async () => {
    if (!tempName.trim()) {
      Alert.alert('Atenção', 'Por favor, insira um nome válido');
      return;
    }
    try {
      await AsyncStorage.setItem('userName', tempName.trim());
      setUserName(tempName.trim());
      setEditing(false);
      setTempName('');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o nome');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name='person' size={48} color='#fff' />
          </View>
          <Text style={styles.avatarName}>{userName}</Text>
        </View>

        {/* Card: Dados pessoais */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados Pessoais</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nome</Text>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.input}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder='Digite seu nome'
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.btnCancel} onPress={cancelEditing}>
                    <Text style={styles.btnCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSave} onPress={saveName}>
                    <Text style={styles.btnSaveText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.fieldRow} onPress={startEditing} activeOpacity={0.7}>
                <Text style={styles.fieldValue}>{userName}</Text>
                <Ionicons name='pencil-outline' size={18} color='#94a3b8' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Card: Backup */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados do App</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/backup' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name='cloud-upload-outline' size={20} color='#7c3aed' />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Backup & Restauração</Text>
                <Text style={styles.menuItemSub}>Exportar e importar seus dados</Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={18} color='#94a3b8' />
          </TouchableOpacity>
        </View>

        {/* Card: Sobre */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sobre</Text>
          <View style={styles.aboutRow}>
            <Ionicons name='storefront-outline' size={20} color='#667eea' />
            <Text style={styles.aboutText}>Top Vendas App</Text>
          </View>
          <Text style={styles.aboutVersion}>Versão 1.0.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 20,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  editRow: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  btnSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuItemSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  aboutVersion: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
