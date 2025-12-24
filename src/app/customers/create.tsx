import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCustomerDatabase } from '@/database/models/Customer';
import { Input } from '@/components/Input';
import WorkArea from '@/components/WorkArea';

export default function CreateCustomer() {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState('CPF');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const customerDatabase = useCustomerDatabase();

  const formatDocument = (text: string, type: string) => {
    const numbers = text.replace(/\D/g, '');

    if (type === 'CPF') {
      const limitedNumbers = numbers.slice(0, 11);
      if (limitedNumbers.length <= 3) return limitedNumbers;
      if (limitedNumbers.length <= 6)
        return limitedNumbers.replace(/(\d{3})(\d+)/, '$1.$2');
      if (limitedNumbers.length <= 9)
        return limitedNumbers.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
      return limitedNumbers.replace(
        /(\d{3})(\d{3})(\d{3})(\d+)/,
        '$1.$2.$3-$4'
      );
    } else {
      const limitedNumbers = numbers.slice(0, 14);
      if (limitedNumbers.length <= 2) return limitedNumbers;
      if (limitedNumbers.length <= 5)
        return limitedNumbers.replace(/(\d{2})(\d+)/, '$1.$2');
      if (limitedNumbers.length <= 8)
        return limitedNumbers.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
      if (limitedNumbers.length <= 12)
        return limitedNumbers.replace(
          /(\d{2})(\d{3})(\d{3})(\d+)/,
          '$1.$2.$3/$4'
        );
      return limitedNumbers.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/,
        '$1.$2.$3/$4-$5'
      );
    }
  };

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);

    if (limitedNumbers.length <= 2) return limitedNumbers;
    if (limitedNumbers.length <= 6)
      return limitedNumbers.replace(/(\d{2})(\d+)/, '($1) $2');
    if (limitedNumbers.length <= 10)
      return limitedNumbers.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    return limitedNumbers.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
  };

  const formatZipCode = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 8);

    if (limitedNumbers.length <= 5) return limitedNumbers;
    return limitedNumbers.replace(/(\d{5})(\d+)/, '$1-$2');
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDocument = (doc: string, type: string) => {
    if (!doc.trim()) return true;
    const numbers = doc.replace(/\D/g, '');
    if (type === 'CPF') {
      return numbers.length === 11;
    } else {
      return numbers.length === 14;
    }
  };

  const getCleanDocument = (formattedDoc: string) => {
    return formattedDoc.replace(/\D/g, '');
  };

  const getCleanPhone = (formattedPhone: string) => {
    return formattedPhone.replace(/\D/g, '');
  };

  const getCleanZipCode = (formattedZip: string) => {
    return formattedZip.replace(/\D/g, '');
  };

  const fetchAddressFromCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );
      const data = await response.json();

      if (data.erro) {
        Alert.alert(
          'CEP não encontrado',
          'O CEP informado não foi encontrado.'
        );
        return;
      }

      setAddress(data.logradouro || '');
      setNeighborhood(data.bairro || '');
      setCity(data.localidade || '');
      setState(data.uf || '');

      Alert.alert(
        'Endereço encontrado!',
        `${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro ? data.bairro + ', ' : ''}${data.localidade || ''} - ${data.uf || ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      Alert.alert(
        'Erro',
        'Não foi possível buscar o endereço. Verifique sua conexão.'
      );
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipCodeChange = (text: string) => {
    const formatted = formatZipCode(text);
    setZipCode(formatted);

    const cleanCep = text.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressFromCep(formatted);
    }
  };

  async function handleStore() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do cliente.');
      return;
    }

    if (document.trim() && !validateDocument(document, documentType)) {
      const expectedLength = documentType === 'CPF' ? '11' : '14';
      Alert.alert(
        'Erro',
        `${documentType} deve ter ${expectedLength} dígitos.`
      );
      return;
    }

    if (email.trim() && !validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    setIsLoading(true);
    try {
      if (email.trim()) {
        const existingByEmail = await customerDatabase.findByEmail(
          email.trim()
        );
        if (existingByEmail) {
          Alert.alert(
            'Erro',
            'Já existe um cliente cadastrado com este email.'
          );
          return;
        }
      }

      if (document.trim()) {
        const cleanDocument = getCleanDocument(document);
        const existingByDocument =
          await customerDatabase.findByDocument(cleanDocument);
        if (existingByDocument) {
          Alert.alert(
            'Erro',
            'Já existe um cliente cadastrado com este documento.'
          );
          return;
        }
      }

      await customerDatabase.store({
        name: name.trim(),
        document: document.trim() ? getCleanDocument(document) : undefined,
        document_type: document.trim() ? documentType : undefined,
        phone: phone.trim() ? getCleanPhone(phone) : undefined,
        mobile: mobile.trim() ? getCleanPhone(mobile) : undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip_code: zipCode.trim() ? getCleanZipCode(zipCode) : undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Sucesso', 'Cliente criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Erro', 'Falha ao criar cliente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    const hasChanges =
      name.trim() ||
      document.trim() ||
      email.trim() ||
      phone.trim() ||
      mobile.trim() ||
      address.trim() ||
      neighborhood.trim() ||
      city.trim() ||
      state.trim() ||
      zipCode.trim() ||
      notes.trim();

    if (hasChanges) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja realmente sair?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const isFormValid =
    name.trim() &&
    validateDocument(document, documentType) &&
    validateEmail(email);

  return (
    <WorkArea>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Ionicons name='person-add-outline' size={48} color='#FF6B35' />
        </View>
        <Text style={styles.title}>Novo Cliente</Text>
        <Text style={styles.subtitle}>Cadastre um novo cliente no sistema</Text>
      </View>

      <View>
        <View style={styles.sectionHeader}>
          <Ionicons name='person-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Dados Básicos</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo *</Text>
          <Input
            placeholder='Nome completo do cliente'
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.pickerGroup}>
            <Text style={styles.label}>Tipo de Documento</Text>
            <View style={styles.documentTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.documentTypeButton,
                  documentType === 'CPF' && styles.documentTypeButtonActive,
                ]}
                onPress={() => setDocumentType('CPF')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.documentTypeText,
                    documentType === 'CPF' && styles.documentTypeTextActive,
                  ]}
                >
                  CPF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.documentTypeButton,
                  documentType === 'CNPJ' && styles.documentTypeButtonActive,
                ]}
                onPress={() => setDocumentType('CNPJ')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.documentTypeText,
                    documentType === 'CNPJ' && styles.documentTypeTextActive,
                  ]}
                >
                  CNPJ
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.label}>{documentType}</Text>
            <Input
              placeholder={
                documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'
              }
              value={document}
              onChangeText={text =>
                setDocument(formatDocument(text, documentType))
              }
              editable={!isLoading}
              style={styles.input}
              keyboardType='numeric'
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <Input
            placeholder='email@exemplo.com (opcional)'
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            style={styles.input}
            keyboardType='email-address'
            autoCapitalize='none'
          />
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name='call-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Contato</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Telefone</Text>
            <Input
              placeholder='(11) 1234-5678'
              value={phone}
              onChangeText={text => setPhone(formatPhone(text))}
              editable={!isLoading}
              style={styles.input}
              keyboardType='phone-pad'
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.label}>Celular</Text>
            <Input
              placeholder='(11) 91234-5678'
              value={mobile}
              onChangeText={text => setMobile(formatPhone(text))}
              editable={!isLoading}
              style={styles.input}
              keyboardType='phone-pad'
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name='location-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Endereço</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CEP</Text>
          <View style={styles.cepContainer}>
            <Input
              placeholder='00000-000'
              value={zipCode}
              onChangeText={handleZipCodeChange}
              editable={!isLoading && !isLoadingCep}
              style={[styles.input, styles.cepInput]}
              keyboardType='numeric'
            />
            {isLoadingCep && (
              <View style={styles.cepLoading}>
                <Ionicons name='hourglass-outline' size={16} color='#FF6B35' />
              </View>
            )}
            <TouchableOpacity
              style={styles.cepButton}
              onPress={() =>
                zipCode.replace(/\D/g, '').length === 8 &&
                fetchAddressFromCep(zipCode)
              }
              disabled={
                isLoading ||
                isLoadingCep ||
                zipCode.replace(/\D/g, '').length !== 8
              }
            >
              <Ionicons
                name='search-outline'
                size={16}
                color={
                  zipCode.replace(/\D/g, '').length === 8
                    ? '#FF6B35'
                    : '#94a3b8'
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço</Text>
          <Input
            placeholder='Rua, número, complemento'
            value={address}
            onChangeText={setAddress}
            editable={!isLoading}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Bairro</Text>
            <Input
              placeholder='Bairro'
              value={neighborhood}
              onChangeText={setNeighborhood}
              editable={!isLoading}
              style={styles.input}
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.label}>Cidade</Text>
            <Input
              placeholder='Cidade'
              value={city}
              onChangeText={setCity}
              editable={!isLoading}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estado</Text>
          <Input
            placeholder='Estado'
            value={state}
            onChangeText={setState}
            editable={!isLoading}
            style={styles.input}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name='document-text-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Observações</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <Input
            placeholder='Informações adicionais sobre o cliente (opcional)'
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            editable={!isLoading}
            style={[styles.input, styles.textArea]}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleStore}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <>
              <Ionicons name='hourglass-outline' size={16} color='#ffffff' />
              <Text style={styles.saveButtonText}>Salvando...</Text>
            </>
          ) : (
            <>
              <Ionicons name='checkmark-outline' size={16} color='#ffffff' />
              <Text style={styles.saveButtonText}>Salvar Cliente</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </WorkArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
  },
  pickerGroup: {
    flex: 1,
  },
  documentTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTypeButtonActive: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  documentTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  documentTypeTextActive: {
    color: '#ffffff',
  },
  cepContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cepInput: {
    flex: 1,
    paddingRight: 80,
  },
  cepLoading: {
    position: 'absolute',
    right: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cepButton: {
    position: 'absolute',
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
