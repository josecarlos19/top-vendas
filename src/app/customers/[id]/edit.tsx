import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCustomerDatabase } from '@/database/models/Customer';
import { Input } from '@/components/Input';
import WorkArea from '@/components/WorkArea';
import { HeaderDeleteButton } from '@/components/HeaderDeleteButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormSection, FormInput, FormRow, InfoCard } from '@/components/Form';
import CustomDialog from '@/components/modals/CustomDialog';

interface Customer {
  id: number;
  name: string;
  document?: string;
  document_type?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  address_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export default function EditCustomer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
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
  const [addressNumber, setAddressNumber] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // CustomDialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogIcon, setDialogIcon] = useState<keyof typeof Ionicons.glyphMap>('information-circle');
  const [dialogIconColor, setDialogIconColor] = useState('#3b82f6');
  const [dialogButtons, setDialogButtons] = useState<Array<{ text: string; onPress: () => void; style?: 'default' | 'primary' | 'danger' | 'success' }>>([]);

  const customerDatabase = useCustomerDatabase();

  useEffect(() => {
    loadCustomer();
  }, [id]);

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

  const formatForDisplay = (
    value: string | undefined,
    type: 'phone' | 'document' | 'zipcode'
  ) => {
    if (!value) return '';

    switch (type) {
      case 'phone':
        return formatPhone(value);
      case 'document':
        return formatDocument(value, documentType);
      case 'zipcode':
        return formatZipCode(value);
      default:
        return value;
    }
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
        setDialogTitle('CEP não encontrado');
        setDialogMessage('O CEP informado não foi encontrado.');
        setDialogIcon('alert-circle');
        setDialogIconColor('#ef4444');
        setDialogButtons([{
          text: 'OK',
          onPress: () => { },
          style: 'default'
        }]);
        setDialogVisible(true);
        return;
      }

      setDialogTitle('Endereço encontrado!');
      setDialogMessage(`${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro ? data.bairro + ', ' : ''}${data.localidade || ''} - ${data.uf || ''}\n\nDeseja substituir o endereço atual?`);
      setDialogIcon('checkmark-circle');
      setDialogIconColor('#22c55e');
      setDialogButtons([
        {
          text: 'Cancelar',
          onPress: () => { },
          style: 'default'
        },
        {
          text: 'Substituir',
          onPress: () => {
            setAddress(data.logradouro || '');
            setNeighborhood(data.bairro || '');
            setCity(data.localidade || '');
            setState(data.uf || '');
          },
          style: 'primary'
        },
      ]);
      setDialogVisible(true);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setDialogTitle('Erro');
      setDialogMessage('Não foi possível buscar o endereço. Verifique sua conexão.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => { },
        style: 'default'
      }]);
      setDialogVisible(true);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipCodeChange = (text: string) => {
    const formatted = formatZipCode(text);
    setZipCode(formatted);
  };

  const loadCustomer = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const foundCustomer = (await customerDatabase.show(
        +id
      )) as Customer | null;

      if (!foundCustomer) {
        setDialogTitle('Erro');
        setDialogMessage('Cliente não encontrado');
        setDialogIcon('alert-circle');
        setDialogIconColor('#ef4444');
        setDialogButtons([{
          text: 'OK',
          onPress: () => router.back(),
          style: 'default'
        }]);
        setDialogVisible(true);
        return;
      }

      setCustomer(foundCustomer);
      setName(foundCustomer.name || '');
      setDocument(formatForDisplay(foundCustomer.document, 'document') || '');
      setDocumentType(foundCustomer.document_type || 'CPF');
      setPhone(formatForDisplay(foundCustomer.phone, 'phone'));
      setMobile(formatForDisplay(foundCustomer.mobile, 'phone'));
      setEmail(foundCustomer.email || '');
      setAddress(foundCustomer.address || '');
      setNeighborhood(foundCustomer.neighborhood || '');
      setCity(foundCustomer.city || '');
      setState(foundCustomer.state || '');
      setAddressNumber(foundCustomer.address_number || '');
      setZipCode(formatForDisplay(foundCustomer.zip_code, 'zipcode'));
      setNotes(foundCustomer.notes || '');
    } catch (error) {
      console.error('Error loading customer:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao carregar cliente');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => { },
        style: 'default'
      }]);
      setDialogVisible(true);
    } finally {
      setIsLoading(false);
    }
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

  const getCleanValue = (formattedValue: string) => {
    return formattedValue.replace(/\D/g, '');
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setDialogTitle('Erro');
      setDialogMessage('Por favor, preencha o nome do cliente.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => { },
        style: 'default'
      }]);
      setDialogVisible(true);
      return;
    }

    if (document.trim() && !validateDocument(document, documentType)) {
      const expectedLength = documentType === 'CPF' ? '11' : '14';
      setDialogTitle('Erro');
      setDialogMessage(`${documentType} deve ter ${expectedLength} dígitos.`);
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => { },
        style: 'default'
      }]);
      setDialogVisible(true);
      return;
    }

    if (email.trim() && !validateEmail(email)) {
      setDialogTitle('Erro');
      setDialogMessage('Por favor, insira um email válido.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => { },
        style: 'default'
      }]);
      setDialogVisible(true);
      return;
    }

    if (!customer) return;

    setIsSaving(true);
    try {
      if (email.trim()) {
        const existingByEmail = await customerDatabase.findByEmail(
          email.trim()
        );
        if (existingByEmail && existingByEmail.id !== customer.id) {
          setDialogTitle('Erro');
          setDialogMessage('Já existe outro cliente cadastrado com este email.');
          setDialogIcon('alert-circle');
          setDialogIconColor('#ef4444');
          setDialogButtons([{
            text: 'OK',
            onPress: () => { },
            style: 'default'
          }]);
          setDialogVisible(true);
          return;
        }
      }

      if (document.trim()) {
        const cleanDocument = getCleanValue(document);
        const existingByDocument =
          await customerDatabase.findByDocument(cleanDocument);
        if (existingByDocument && existingByDocument.id !== customer.id) {
          setDialogTitle('Erro');
          setDialogMessage('Já existe outro cliente cadastrado com este documento.');
          setDialogIcon('alert-circle');
          setDialogIconColor('#ef4444');
          setDialogButtons([{
            text: 'OK',
            onPress: () => { },
            style: 'default'
          }]);
          setDialogVisible(true);
          return;
        }
      }

      await customerDatabase.update({
        id: customer.id,
        name: name.trim(),
        document: document.trim() ? getCleanValue(document) : undefined,
        document_type: document.trim() ? documentType : undefined,
        phone: phone.trim() ? getCleanValue(phone) : undefined,
        mobile: mobile.trim() ? getCleanValue(mobile) : undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        address_number: addressNumber.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip_code: zipCode.trim() ? getCleanValue(zipCode) : undefined,
        notes: notes.trim() || undefined,
      });

      setDialogTitle('Sucesso');
      setDialogMessage('Cliente atualizado com sucesso!');
      setDialogIcon('checkmark-circle');
      setDialogIconColor('#22c55e');
      setDialogButtons([{
        text: 'OK',
        onPress: () => router.back(),
        style: 'primary'
      }]);
      setDialogVisible(true);
    } catch (error) {
      console.error('Error updating customer:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao atualizar cliente. Tente novamente.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => { },
        style: 'default'
      }]);
      setDialogVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!customer) return;

    try {
      await customerDatabase.remove(customer.id);
      router.back();
    } catch (error) {
      console.error('Error deleting:', error);
      throw error;
    }
  }, [customer]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#FF6B35' />
        <Text style={styles.loadingText}>Carregando cliente...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle-outline' size={64} color='#ef4444' />
        <Text style={styles.errorTitle}>Cliente não encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFormValid =
    name.trim() &&
    validateDocument(document, documentType) &&
    validateEmail(email);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <WorkArea>
        <HeaderDeleteButton
          onDelete={handleDelete}
          itemName={customer?.name || ''}
          itemType='o cliente'
          successMessage='Cliente excluído(a) com sucesso!'
        />
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='person-outline' size={48} color='#FF6B35' />
          </View>
          <Text style={styles.title}>Editar Cliente</Text>
          <Text style={styles.subtitle}>Atualize as informações do cliente</Text>
        </View>

        <View style={styles.formSection}>
          <FormSection icon='person-outline' title='Dados Básicos' marginTop={0}>
            <FormInput
              label='Nome Completo'
              required
              placeholder='Nome completo do cliente'
              value={name}
              onChangeText={setName}
              editable={!isSaving}
            />

            <FormRow>
              <View style={styles.pickerGroup}>
                <Text style={styles.label}>Tipo de Documento</Text>
                <View style={styles.documentTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.documentTypeButton,
                      documentType === 'CPF' && styles.documentTypeButtonActive,
                    ]}
                    onPress={() => {
                      setDocumentType('CPF');
                      setDocument(formatDocument(document, 'CPF'));
                    }}
                    disabled={isSaving}
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
                    onPress={() => {
                      setDocumentType('CNPJ');
                      setDocument(formatDocument(document, 'CNPJ'));
                    }}
                    disabled={isSaving}
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

              <FormInput
                label={documentType}
                placeholder={
                  documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'
                }
                value={document}
                onChangeText={text =>
                  setDocument(formatDocument(text, documentType))
                }
                editable={!isSaving}
                keyboardType='numeric'
                containerStyle={styles.inputHalf}
              />
            </FormRow>

            <FormInput
              label='Email'
              placeholder='email@exemplo.com (opcional)'
              value={email}
              onChangeText={setEmail}
              editable={!isSaving}
              keyboardType='email-address'
              autoCapitalize='none'
            />
          </FormSection>

          <FormSection icon='call-outline' title='Contato'>
            <FormRow>
              <FormInput
                label='Telefone'
                placeholder='(11) 1234-5678'
                value={phone}
                onChangeText={text => setPhone(formatPhone(text))}
                editable={!isSaving}
                keyboardType='phone-pad'
                containerStyle={styles.inputHalf}
              />

              <FormInput
                label='Celular'
                placeholder='(11) 91234-5678'
                value={mobile}
                onChangeText={text => setMobile(formatPhone(text))}
                editable={!isSaving}
                keyboardType='phone-pad'
                containerStyle={styles.inputHalf}
              />
            </FormRow>
          </FormSection>

          <FormSection icon='location-outline' title='Endereço'>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP</Text>
              <View style={styles.cepContainer}>
                <Input
                  placeholder='00000-000'
                  value={zipCode}
                  onChangeText={handleZipCodeChange}
                  editable={!isSaving && !isLoadingCep}
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
                    isSaving ||
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

            <FormInput
              label='Endereço'
              placeholder='Rua, número, complemento'
              value={address}
              onChangeText={setAddress}
              editable={!isSaving}
            />

            <FormRow>
              <FormInput
                label='Bairro'
                placeholder='Bairro'
                value={neighborhood}
                onChangeText={setNeighborhood}
                editable={!isSaving}
                containerStyle={styles.inputHalf}
              />

              <FormInput
                label='Cidade'
                placeholder='Cidade'
                value={city}
                onChangeText={setCity}
                editable={!isSaving}
                containerStyle={styles.inputHalf}
              />
            </FormRow>

            <FormRow>
              <FormInput
                label='Número'
                placeholder='Número'
                value={addressNumber}
                onChangeText={setAddressNumber}
                editable={!isSaving}
                keyboardType='numeric'
                containerStyle={styles.inputHalf}
              />

              <FormInput
                label='Estado'
                placeholder='UF'
                value={state}
                onChangeText={setState}
                editable={!isSaving}
                autoCapitalize='characters'
                maxLength={2}
                containerStyle={styles.inputHalf}
              />
            </FormRow>
          </FormSection>

          <FormSection icon='document-text-outline' title='Observações'>
            <FormInput
              label='Observações'
              placeholder='Informações adicionais sobre o cliente (opcional)'
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              editable={!isSaving}
              style={styles.textArea}
            />
          </FormSection>

          <InfoCard variant='warning' icon='warning-outline'>
            Não é possível excluir clientes que possuem vendas associadas.
            Para excluir, remova as vendas primeiro.
          </InfoCard>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleUpdate}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size='small' color='#ffffff' />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons name='checkmark-outline' size={16} color='#ffffff' />
                <Text style={styles.saveButtonText}>Salvar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </WorkArea>

      <CustomDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        icon={dialogIcon}
        iconColor={dialogIconColor}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
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
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputHalf: {
    flex: 1,
  },
  pickerGroup: {
    flex: 1,
    marginBottom: 12,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 20,
  },
  saveButton: {
    flex: 1,
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
