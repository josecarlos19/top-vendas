import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCustomerDatabase } from '@/database/models/Customer';
import { Input } from '@/components/Input';
import WorkArea from '@/components/WorkArea';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormSection, FormInput, FormRow } from '@/components/Form';
import CustomDialog from '@/components/modals/CustomDialog';

export default function CreateCustomer() {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState('CPF');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogIcon, setDialogIcon] = useState<keyof typeof Ionicons.glyphMap>('information-circle');
  const [dialogIconColor, setDialogIconColor] = useState('#3b82f6');
  const [dialogButtons, setDialogButtons] = useState<Array<{ text: string; onPress: () => void; style?: 'default' | 'primary' | 'danger' | 'success' }>>([]);

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

      setAddress(data.logradouro || '');
      setNeighborhood(data.bairro || '');
      setCity(data.localidade || '');
      setState(data.uf || '');

      setDialogTitle('Endereço encontrado!');
      setDialogMessage(`${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro ? data.bairro + ', ' : ''}${data.localidade || ''} - ${data.uf || ''}`);
      setDialogIcon('checkmark-circle');
      setDialogIconColor('#22c55e');
      setDialogButtons([{
        text: 'OK',
        onPress: () => { },
        style: 'primary'
      }]);
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

    const cleanCep = text.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressFromCep(formatted);
    }
  };

  async function handleStore() {
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

    setIsLoading(true);
    try {
      if (email.trim()) {
        const existingByEmail = await customerDatabase.findByEmail(
          email.trim()
        );
        if (existingByEmail) {
          setDialogTitle('Erro');
          setDialogMessage('Já existe um cliente cadastrado com este email.');
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
        const cleanDocument = getCleanDocument(document);
        const existingByDocument =
          await customerDatabase.findByDocument(cleanDocument);
        if (existingByDocument) {
          setDialogTitle('Erro');
          setDialogMessage('Já existe um cliente cadastrado com este documento.');
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

      await customerDatabase.store({
        name: name.trim(),
        document: document.trim() ? getCleanDocument(document) : undefined,
        document_type: document.trim() ? documentType : undefined,
        phone: phone.trim() ? getCleanPhone(phone) : undefined,
        mobile: mobile.trim() ? getCleanPhone(mobile) : undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        address_number: addressNumber.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip_code: zipCode.trim() ? getCleanZipCode(zipCode) : undefined,
        notes: notes.trim() || undefined,
      });

      setDialogTitle('Sucesso');
      setDialogMessage('Cliente criado com sucesso!');
      setDialogIcon('checkmark-circle');
      setDialogIconColor('#22c55e');
      setDialogButtons([{
        text: 'OK',
        onPress: () => {
          router.back();
        },
        style: 'primary'
      }]);
      setDialogVisible(true);
    } catch (error) {
      console.error('Error creating customer:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao criar cliente. Tente novamente.');
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
  }

  const isFormValid =
    name.trim() &&
    validateDocument(document, documentType) &&
    validateEmail(email);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <WorkArea>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='person-add-outline' size={48} color='#FF6B35' />
          </View>
          <Text style={styles.title}>Novo Cliente</Text>
          <Text style={styles.subtitle}>Cadastre um novo cliente no sistema</Text>
        </View>

        <View>
          <FormSection icon='person-outline' title='Dados Básicos' marginTop={0}>
            <FormInput
              label='Nome Completo'
              placeholder='Nome completo do cliente'
              value={name}
              onChangeText={setName}
              editable={!isLoading}
              required
            />
          </FormSection>

          <FormRow>
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
              <FormInput
                label={documentType}
                placeholder={
                  documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'
                }
                value={document}
                onChangeText={text =>
                  setDocument(formatDocument(text, documentType))
                }
                editable={!isLoading}
                keyboardType='numeric'
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </FormRow>

          <FormInput
            label='Email'
            placeholder='email@exemplo.com (opcional)'
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType='email-address'
            autoCapitalize='none'
          />

          <FormSection icon='call-outline' title='Contato'>
            <FormRow>
              <View style={styles.inputHalf}>
                <FormInput
                  label='Telefone'
                  placeholder='(11) 1234-5678'
                  value={phone}
                  onChangeText={text => setPhone(formatPhone(text))}
                  editable={!isLoading}
                  keyboardType='phone-pad'
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              <View style={styles.inputHalf}>
                <FormInput
                  label='Celular'
                  placeholder='(11) 91234-5678'
                  value={mobile}
                  onChangeText={text => setMobile(formatPhone(text))}
                  editable={!isLoading}
                  keyboardType='phone-pad'
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
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

            <FormRow>
              <View style={styles.inputHalf}>
                <FormInput
                  label='Número'
                  placeholder='Número'
                  value={addressNumber}
                  onChangeText={setAddressNumber}
                  keyboardType='numeric'
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              <View style={styles.inputHalf}>
                <FormInput
                  label='Estado'
                  placeholder='UF'
                  value={state}
                  onChangeText={setState}
                  autoCapitalize='characters'
                  maxLength={2}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </FormRow>

            <FormRow>
              <View style={styles.inputHalf}>
                <FormInput
                  label='Bairro'
                  placeholder='Bairro'
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  editable={!isLoading}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              <View style={styles.inputHalf}>
                <FormInput
                  label='Cidade'
                  placeholder='Cidade'
                  value={city}
                  onChangeText={setCity}
                  editable={!isLoading}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </FormRow>

            <FormInput
              label='Endereço'
              placeholder='Rua, Avenida...'
              value={address}
              onChangeText={setAddress}
              editable={!isLoading}
            />
          </FormSection>

          <FormSection icon='document-text-outline' title='Observações'>
            <FormInput
              label='Observações'
              placeholder='Informações adicionais sobre o cliente (opcional)'
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              editable={!isLoading}
              style={styles.textArea}
            />
          </FormSection>
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
  inputGroup: {
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  actionButtons: {
    marginTop: 'auto',
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
