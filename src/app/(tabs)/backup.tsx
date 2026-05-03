import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  exportDatabase,
  shareBackup,
  pickBackupFile,
  importDatabase,
  validateBackupFile,
  listBackups,
  deleteBackup,
  getBackupInfo,
} from '@/database/backup';
import { DateTime } from 'luxon';
import * as Updates from 'expo-updates';
import { useCustomDialog } from '@/hooks/useCustomDialog';
import CustomDialog from '@/components/modals/CustomDialog';

async function reloadApp(dialog: any) {
  try {
    await Updates.reloadAsync();
  } catch (error) {
    dialog.showAlert(
      'Reinicie o app',
      'O backup foi importado com sucesso! Por favor, feche e abra o app manualmente para aplicar as alterações.'
    );
  }
}

export default function BackupScreen() {
  const dialog = useCustomDialog();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [backups, setBackups] = useState<
    Array<{
      name: string;
      path: string;
      size: number;
      date: Date;
      sizeFormatted: string;
    }>
  >([]);

  const loadBackups = useCallback(async () => {
    try {
      const backupsList = await listBackups();
      setBackups(backupsList);
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBackups();
    setRefreshing(false);
  }, [loadBackups]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleExport = async () => {
    try {
      setLoading(true);
      const backupPath = await exportDatabase();

      dialog.showConfirm(
        'Backup Criado',
        'Deseja compartilhar o arquivo de backup?',
        async () => {
          try {
            await shareBackup(backupPath);
            await loadBackups();
          } catch (error: any) {
            dialog.showError('Erro', error.message || 'Erro ao compartilhar backup');
          }
        },
        async () => {
          await loadBackups();
        },
        'Sim',
        'Não'
      );
    } catch (error: any) {
      dialog.showError('Erro', error.message || 'Erro ao criar backup');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    dialog.showDestructive(
      'Atenção',
      'Ao importar um backup, todos os dados atuais serão substituídos. Deseja continuar?',
      async () => {
        try {
          setLoading(true);
          const fileUri = await pickBackupFile();

          if (!fileUri) {
            setLoading(false);
            return;
          }
          const isValid = await validateBackupFile(fileUri);
          if (!isValid) {
            dialog.showError('Erro', 'O arquivo selecionado não é um backup válido');
            setLoading(false);
            return;
          }

          await importDatabase(fileUri);

          dialog.showConfirm(
            'Sucesso',
            'Backup importado com sucesso! O app será reiniciado.',
            () => reloadApp(dialog),
            undefined,
            'OK'
          );
        } catch (error: any) {
          dialog.showError('Erro', error.message || 'Erro ao importar backup');
        } finally {
          setLoading(false);
        }
      },
      undefined,
      'Continuar',
      'Cancelar'
    );
  };

  const handleShareBackup = async (path: string) => {
    try {
      setLoading(true);
      await shareBackup(path);
    } catch (error: any) {
      dialog.showError('Erro', error.message || 'Erro ao compartilhar backup');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (path: string, name: string) => {
    dialog.showDestructive(
      'Confirmar exclusão',
      `Deseja excluir o backup "${name}"?`,
      async () => {
        try {
          setLoading(true);
          await deleteBackup(path);
          await loadBackups();
          dialog.showSuccess('Sucesso', 'Backup excluído com sucesso');
        } catch (error: any) {
          dialog.showError('Erro', error.message || 'Erro ao excluir backup');
        } finally {
          setLoading(false);
        }
      },
      undefined,
      'Excluir',
      'Cancelar'
    );
  };

  const handleRestoreBackup = async (path: string, name: string) => {
    dialog.showDestructive(
      'Atenção',
      `Ao restaurar o backup "${name}", todos os dados atuais serão substituídos. Deseja continuar?`,
      async () => {
        try {
          setLoading(true);
          await importDatabase(path);

          dialog.showConfirm(
            'Sucesso',
            'Backup restaurado com sucesso! O app será reiniciado.',
            () => reloadApp(dialog),
            undefined,
            'OK'
          );
        } catch (error: any) {
          dialog.showError('Erro', error.message || 'Erro ao restaurar backup');
        } finally {
          setLoading(false);
        }
      },
      undefined,
      'Restaurar',
      'Cancelar'
    );
  };

  const formatDate = (date: Date) => {
    return DateTime.fromJSDate(date).toFormat("dd/MM/yyyy 'às' HH:mm");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoIcon}>
            <Ionicons name='information-circle' size={24} color='#3b82f6' />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Sobre Backups</Text>
            <Text style={styles.infoText}>
              Faça backup regularmente dos seus dados para não perder informações importantes.
              Você pode compartilhar o backup via email, WhatsApp, Google Drive, etc.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={handleExport}
            disabled={loading}
          >
            <Ionicons name='cloud-upload-outline' size={24} color='#fff' />
            <Text style={styles.buttonText}>Criar Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.importButton]}
            onPress={handleImport}
            disabled={loading}
          >
            <Ionicons name='cloud-download-outline' size={24} color='#fff' />
            <Text style={styles.buttonText}>Importar Backup</Text>
          </TouchableOpacity>
        </View>

        {/* Backups List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Backups Salvos</Text>

          {backups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name='folder-open-outline' size={64} color='#cbd5e1' />
              <Text style={styles.emptyText}>Nenhum backup encontrado</Text>
              <Text style={styles.emptySubtext}>
                Crie um backup para proteger seus dados
              </Text>
            </View>
          ) : (
            backups.map((backup, index) => (
              <View key={backup.path} style={styles.backupCard}>
                <View style={styles.backupIcon}>
                  <Ionicons name='file-tray-full' size={24} color='#667eea' />
                </View>

                <View style={styles.backupInfo}>
                  <Text style={styles.backupDate}>
                    {formatDate(backup.date)}
                  </Text>
                  <Text style={styles.backupSize}>{backup.sizeFormatted}</Text>
                </View>

                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleRestoreBackup(backup.path, backup.name)}
                    disabled={loading}
                  >
                    <Ionicons name='refresh-circle' size={28} color='#10b981' />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleShareBackup(backup.path)}
                    disabled={loading}
                  >
                    <Ionicons name='share-social' size={28} color='#3b82f6' />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDeleteBackup(backup.path, backup.name)}
                    disabled={loading}
                  >
                    <Ionicons name='trash' size={28} color='#ef4444' />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Warning Section */}
        <View style={styles.warningSection}>
          <View style={styles.warningIcon}>
            <Ionicons name='warning' size={20} color='#f59e0b' />
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Importante</Text>
            <Text style={styles.warningText}>
              • Ao importar/restaurar um backup, todos os dados atuais serão substituídos{'\n'}
              • Guarde seus backups em um local seguro (nuvem, email, etc){'\n'}
              • Faça backups regularmente para não perder seus dados
            </Text>
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size='large' color='#667eea' />
            <Text style={styles.loadingText}>Processando...</Text>
          </View>
        </View>
      )}

      <CustomDialog
        visible={dialog.config.visible}
        title={dialog.config.title}
        message={dialog.config.message}
        icon={dialog.config.icon}
        iconColor={dialog.config.iconColor}
        buttons={dialog.config.buttons}
        onClose={dialog.hideDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
  buttonSection: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButton: {
    backgroundColor: '#667eea',
  },
  importButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  backupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backupInfo: {
    flex: 1,
  },
  backupDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  backupSize: {
    fontSize: 12,
    color: '#64748b',
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  warningSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
  },
  warningIcon: {
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1e293b',
  },
});
