import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { SQLiteDatabase, defaultDatabaseDirectory } from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'top-vendas.db';

/**
 * Obtém o URI do banco de dados SQLite
 */
function getDatabaseUri(): string {
  // Converte o caminho relativo para URI absoluto
  return `file://${defaultDatabaseDirectory}/${DB_NAME}`;
}

/**
 * Verifica se o banco de dados existe
 */
async function databaseExists(): Promise<boolean> {
  try {
    const dbUri = getDatabaseUri();
    const info = await FileSystem.getInfoAsync(dbUri);
    return info.exists;
  } catch (error) {
    console.log('Erro ao verificar banco:', error);
    return false;
  }
}

/**
 * Exporta o banco de dados para um arquivo de backup
 * @returns Caminho do arquivo de backup criado
 */
export async function exportDatabase(): Promise<string> {
  try {
    const dbUri = getDatabaseUri();

    console.log('Tentando acessar banco em:', dbUri);

    // Verifica se o banco de dados existe
    const exists = await databaseExists();
    if (!exists) {
      // Lista os arquivos para debug
      console.log('=== DEBUG: Listando arquivos ===');
      console.log('defaultDatabaseDirectory:', defaultDatabaseDirectory);
      console.log('URI do banco:', dbUri);

      try {
        const dirUri = `file://${defaultDatabaseDirectory}`;
        const contents = await FileSystem.readDirectoryAsync(dirUri);
        console.log('Conteúdo do diretório SQLite:', contents);
      } catch (e) {
        console.log('Erro ao listar diretório:', e);
      }

      throw new Error(
        'Banco de dados não encontrado. Caminho esperado: ' + dbUri
      );
    }

    console.log('Banco de dados encontrado em:', dbUri);

    // Cria o nome do arquivo de backup com data/hora em horário local (UTC-3)
    const now = new Date();
    // Ajusta para UTC-3 (horário de Brasília)
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const timestamp = brazilTime.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `top-vendas-backup-${timestamp}.db`;
    const backupUri = `${FileSystem.documentDirectory}${backupFileName}`;

    console.log('Criando backup em:', backupUri);

    // Copia o banco de dados para o arquivo de backup
    await FileSystem.copyAsync({
      from: dbUri,
      to: backupUri,
    });

    console.log('Backup criado com sucesso!');

    return backupUri;
  } catch (error) {
    console.error('Erro ao exportar banco de dados:', error);
    throw error;
  }
}

/**
 * Compartilha o arquivo de backup
 * @param backupPath Caminho do arquivo de backup
 */
export async function shareBackup(backupPath: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Compartilhamento não disponível neste dispositivo');
    }

    await Sharing.shareAsync(backupPath, {
      dialogTitle: 'Compartilhar backup do Top Vendas',
    });
  } catch (error) {
    console.error('Erro ao compartilhar backup:', error);
    throw error;
  }
}

/**
 * Seleciona um arquivo de backup para importação
 * @returns Caminho do arquivo selecionado ou null se cancelado
 */
export async function pickBackupFile(): Promise<string | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*', // Aceita qualquer tipo de arquivo (validação é feita depois)
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Erro ao selecionar arquivo:', error);
    throw error;
  }
}

/**
 * Importa um banco de dados a partir de um arquivo de backup
 * @param backupUri URI do arquivo de backup
 * @returns true se a importação foi bem-sucedida
 */
export async function importDatabase(backupUri: string): Promise<boolean> {
  try {
    // Verifica se o arquivo de backup existe
    const backupInfo = await FileSystem.getInfoAsync(backupUri);
    if (!backupInfo.exists) {
      throw new Error('Arquivo de backup não encontrado');
    }

    const dbUri = getDatabaseUri();

    // Cria um backup temporário do banco atual antes de substituir
    const dbExists = await databaseExists();
    if (dbExists) {
      const tempBackupUri = `${FileSystem.documentDirectory}temp-backup-${Date.now()}.db`;

      try {
        // Cria backup temporário
        await FileSystem.copyAsync({
          from: dbUri,
          to: tempBackupUri,
        });

        // Substitui o banco de dados atual pelo backup
        await FileSystem.copyAsync({
          from: backupUri,
          to: dbUri,
        });

        // Remove o backup temporário após sucesso
        await FileSystem.deleteAsync(tempBackupUri, { idempotent: true });
      } catch (error) {
        // Restaura o backup temporário em caso de erro
        try {
          await FileSystem.copyAsync({
            from: tempBackupUri,
            to: dbUri,
          });
          await FileSystem.deleteAsync(tempBackupUri, { idempotent: true });
        } catch (restoreError) {
          console.error('Erro ao restaurar backup temporário:', restoreError);
        }
        throw error;
      }
    } else {
      // Se não existe banco atual, apenas copia o backup
      await FileSystem.copyAsync({
        from: backupUri,
        to: dbUri,
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao importar banco de dados:', error);
    throw error;
  }
}

/**
 * Valida se um arquivo é um banco de dados SQLite válido
 * @param uri URI do arquivo a ser validado
 * @returns true se é válido
 */
export async function validateBackupFile(uri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      return false;
    }

    // Lê os primeiros 16 bytes para verificar o header SQLite
    const header = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
      length: 16,
    });

    // Decodifica e verifica se começa com "SQLite format 3"
    const headerBytes = atob(header);
    return headerBytes.startsWith('SQLite format 3');
  } catch (error) {
    console.error('Erro ao validar arquivo:', error);
    return false;
  }
}

/**
 * Obtém informações sobre o backup
 * @param uri URI do arquivo de backup
 */
export async function getBackupInfo(uri: string): Promise<{
  size: number;
  modifiedAt: number;
  sizeFormatted: string;
}> {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    throw new Error('Arquivo não encontrado');
  }

  // Type guard: após verificar exists, podemos acessar size e modificationTime
  const size = 'size' in info ? (info.size || 0) : 0;
  const modifiedAt = 'modificationTime' in info ? (info.modificationTime || 0) : 0;
  const sizeFormatted = formatBytes(size);

  return {
    size,
    modifiedAt,
    sizeFormatted,
  };
}

/**
 * Formata bytes para uma string legível
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Lista todos os backups no diretório de documentos
 */
export async function listBackups(): Promise<
  Array<{
    name: string;
    path: string;
    size: number;
    date: Date;
    sizeFormatted: string;
  }>
> {
  try {
    const files = await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory!
    );
    const backupFiles = files.filter(
      (file) => file.startsWith('top-vendas-backup-') && file.endsWith('.db')
    );

    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const path = `${FileSystem.documentDirectory}${file}`;
        const info = await FileSystem.getInfoAsync(path);

        // Type guard para acessar propriedades quando exists é true
        const size = info.exists && 'size' in info ? (info.size || 0) : 0;

        // Extrai a data do nome do arquivo
        // Formato: top-vendas-backup-2025-01-15T18-58-30.db
        const dateMatch = file.match(/top-vendas-backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.db/);
        let date: Date;

        if (dateMatch) {
          // Reconstrói o formato ISO (substitui os - por : nas horas)
          const isoString = dateMatch[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3');
          // A data no arquivo já está em UTC-3, então precisamos adicionar o offset para converter corretamente
          date = new Date(isoString + '-03:00');
        } else {
          // Fallback: usa modificationTime se não conseguir extrair do nome
          const modificationTime = info.exists && 'modificationTime' in info ? (info.modificationTime || 0) : 0;
          date = new Date(modificationTime * 1000);
        }

        return {
          name: file,
          path,
          size,
          date,
          sizeFormatted: formatBytes(size),
        };
      })
    );

    // Ordena por data, mais recente primeiro
    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return [];
  }
}

/**
 * Remove um arquivo de backup
 * @param backupPath Caminho do arquivo de backup
 */
export async function deleteBackup(backupPath: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(backupPath, { idempotent: true });
  } catch (error) {
    console.error('Erro ao deletar backup:', error);
    throw error;
  }
}
