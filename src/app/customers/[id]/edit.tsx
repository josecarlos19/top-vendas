import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCustomerDatabase } from "@/database/models/Customer";
import { Input } from "@/components/Input";

interface Customer {
  id: number;
  name: string;
  document?: string;
  document_type?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
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
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [documentType, setDocumentType] = useState("CPF");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const customerDatabase = useCustomerDatabase();

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const formatDocument = (text: string, type: string) => {
    const numbers = text.replace(/\D/g, '');

    if (type === "CPF") {
      const limitedNumbers = numbers.slice(0, 11);
      if (limitedNumbers.length <= 3) return limitedNumbers;
      if (limitedNumbers.length <= 6) return limitedNumbers.replace(/(\d{3})(\d+)/, '$1.$2');
      if (limitedNumbers.length <= 9) return limitedNumbers.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
      return limitedNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
    } else {
      const limitedNumbers = numbers.slice(0, 14);
      if (limitedNumbers.length <= 2) return limitedNumbers;
      if (limitedNumbers.length <= 5) return limitedNumbers.replace(/(\d{2})(\d+)/, '$1.$2');
      if (limitedNumbers.length <= 8) return limitedNumbers.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
      if (limitedNumbers.length <= 12) return limitedNumbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
      return limitedNumbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
    }
  };

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);

    if (limitedNumbers.length <= 2) return limitedNumbers;
    if (limitedNumbers.length <= 6) return limitedNumbers.replace(/(\d{2})(\d+)/, '($1) $2');
    if (limitedNumbers.length <= 10) return limitedNumbers.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    return limitedNumbers.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
  };

  const formatZipCode = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 8);

    if (limitedNumbers.length <= 5) return limitedNumbers;
    return limitedNumbers.replace(/(\d{5})(\d+)/, '$1-$2');
  };

  const formatForDisplay = (value: string | undefined, type: 'phone' | 'document' | 'zipcode') => {
    if (!value) return "";

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
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        Alert.alert("CEP não encontrado", "O CEP informado não foi encontrado.");
        return;
      }

      Alert.alert(
        "Endereço encontrado!",
        `${data.logradouro ? data.logradouro + ", " : ""}${data.bairro ? data.bairro + ", " : ""}${data.localidade || ""} - ${data.uf || ""}\n\nDeseja substituir o endereço atual?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Substituir",
            onPress: () => {
              setAddress(data.logradouro || "");
              setNeighborhood(data.bairro || "");
              setCity(data.localidade || "");
              setState(data.uf || "");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      Alert.alert("Erro", "Não foi possível buscar o endereço. Verifique sua conexão.");
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
      const foundCustomer = await customerDatabase.show(+id) as Customer | null;

      if (!foundCustomer) {
        Alert.alert("Erro", "Cliente não encontrado", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      setCustomer(foundCustomer);
      setName(foundCustomer.name || "");
      setDocument(formatForDisplay(foundCustomer.document, 'document') || "");
      setDocumentType(foundCustomer.document_type || "CPF");
      setPhone(formatForDisplay(foundCustomer.phone, 'phone'));
      setMobile(formatForDisplay(foundCustomer.mobile, 'phone'));
      setEmail(foundCustomer.email || "");
      setAddress(foundCustomer.address || "");
      setNeighborhood(foundCustomer.neighborhood || "");
      setCity(foundCustomer.city || "");
      setState(foundCustomer.state || "");
      setZipCode(formatForDisplay(foundCustomer.zip_code, 'zipcode'));
      setNotes(foundCustomer.notes || "");
    } catch (error) {
      console.error("Error loading customer:", error);
      Alert.alert("Erro", "Falha ao carregar cliente");
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
    if (type === "CPF") {
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
      Alert.alert("Erro", "Por favor, preencha o nome do cliente.");
      return;
    }

    if (document.trim() && !validateDocument(document, documentType)) {
      const expectedLength = documentType === "CPF" ? "11" : "14";
      Alert.alert("Erro", `${documentType} deve ter ${expectedLength} dígitos.`);
      return;
    }

    if (email.trim() && !validateEmail(email)) {
      Alert.alert("Erro", "Por favor, insira um email válido.");
      return;
    }

    if (!customer) return;

    setIsSaving(true);
    try {
      if (email.trim()) {
        const existingByEmail = await customerDatabase.findByEmail(email.trim());
        if (existingByEmail && existingByEmail.id !== customer.id) {
          Alert.alert("Erro", "Já existe outro cliente cadastrado com este email.");
          return;
        }
      }

      if (document.trim()) {
        const cleanDocument = getCleanValue(document);
        const existingByDocument = await customerDatabase.findByDocument(cleanDocument);
        if (existingByDocument && existingByDocument.id !== customer.id) {
          Alert.alert("Erro", "Já existe outro cliente cadastrado com este documento.");
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
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip_code: zipCode.trim() ? getCleanValue(zipCode) : undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert("Sucesso", "Cliente atualizado com sucesso!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating customer:", error);
      Alert.alert("Erro", "Falha ao atualizar cliente. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!customer) return;

    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir o cliente "${customer.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!customer) return;

    try {
      await customerDatabase.remove(customer.id);
      Alert.alert("Sucesso", "Cliente excluído com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error deleting customer:", error);
      Alert.alert("Erro", "Falha ao excluir cliente");
    }
  };

  const handleToggleActive = async () => {
    if (!customer) return;

    try {
      await customerDatabase.toggleActive(customer.id);
      const updatedCustomer = { ...customer, active: customer.active === 1 ? 0 : 1 };
      setCustomer(updatedCustomer);

      const status = updatedCustomer.active === 1 ? "ativado" : "desativado";
      Alert.alert("Sucesso", `Cliente ${status} com sucesso!`);
    } catch (error) {
      console.error("Error toggling customer status:", error);
      Alert.alert("Erro", "Falha ao alterar status do cliente");
    }
  };

  const handleCancel = () => {
    const hasChanges =
      name !== (customer?.name || "") ||
      getCleanValue(document) !== (customer?.document || "") ||
      documentType !== (customer?.document_type || "CPF") ||
      getCleanValue(phone) !== (customer?.phone || "") ||
      getCleanValue(mobile) !== (customer?.mobile || "") ||
      email !== (customer?.email || "") ||
      address !== (customer?.address || "") ||
      neighborhood !== (customer?.neighborhood || "") ||
      city !== (customer?.city || "") ||
      state !== (customer?.state || "") ||
      getCleanValue(zipCode) !== (customer?.zip_code || "") ||
      notes !== (customer?.notes || "");

    if (hasChanges) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem alterações não salvas. Deseja realmente sair?",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando cliente...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
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

  const isFormValid = name.trim() &&
    validateDocument(document, documentType) &&
    validateEmail(email);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-outline" size={48} color="#FF6B35" />
          </View>
          <Text style={styles.title}>Editar Cliente</Text>
          <Text style={styles.subtitle}>
            Atualize as informações do cliente
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Dados Básicos</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo *</Text>
            <Input
              placeholder="Nome completo do cliente"
              value={name}
              onChangeText={setName}
              editable={!isSaving}
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
                    documentType === "CPF" && styles.documentTypeButtonActive
                  ]}
                  onPress={() => {
                    setDocumentType("CPF");
                    setDocument(formatDocument(document, "CPF"));
                  }}
                  disabled={isSaving}
                >
                  <Text style={[
                    styles.documentTypeText,
                    documentType === "CPF" && styles.documentTypeTextActive
                  ]}>
                    CPF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.documentTypeButton,
                    documentType === "CNPJ" && styles.documentTypeButtonActive
                  ]}
                  onPress={() => {
                    setDocumentType("CNPJ");
                    setDocument(formatDocument(document, "CNPJ"));
                  }}
                  disabled={isSaving}
                >
                  <Text style={[
                    styles.documentTypeText,
                    documentType === "CNPJ" && styles.documentTypeTextActive
                  ]}>
                    CNPJ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>{documentType}</Text>
              <Input
                placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                value={document}
                onChangeText={(text) => setDocument(formatDocument(text, documentType))}
                editable={!isSaving}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Input
              placeholder="email@exemplo.com (opcional)"
              value={email}
              onChangeText={setEmail}
              editable={!isSaving}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Contato</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Telefone</Text>
              <Input
                placeholder="(11) 1234-5678"
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                editable={!isSaving}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Celular</Text>
              <Input
                placeholder="(11) 91234-5678"
                value={mobile}
                onChangeText={(text) => setMobile(formatPhone(text))}
                editable={!isSaving}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Endereço</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CEP</Text>
            <View style={styles.cepContainer}>
              <Input
                placeholder="00000-000"
                value={zipCode}
                onChangeText={handleZipCodeChange}
                editable={!isSaving && !isLoadingCep}
                style={[styles.input, styles.cepInput]}
                keyboardType="numeric"
              />
              {isLoadingCep && (
                <View style={styles.cepLoading}>
                  <Ionicons name="hourglass-outline" size={16} color="#FF6B35" />
                </View>
              )}
              <TouchableOpacity
                style={styles.cepButton}
                onPress={() => zipCode.replace(/\D/g, '').length === 8 && fetchAddressFromCep(zipCode)}
                disabled={isSaving || isLoadingCep || zipCode.replace(/\D/g, '').length !== 8}
              >
                <Ionicons name="search-outline" size={16} color={zipCode.replace(/\D/g, '').length === 8 ? "#FF6B35" : "#94a3b8"} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço</Text>
            <Input
              placeholder="Rua, número, complemento"
              value={address}
              onChangeText={setAddress}
              editable={!isSaving}
              style={styles.input}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Bairro</Text>
              <Input
                placeholder="Bairro"
                value={neighborhood}
                onChangeText={setNeighborhood}
                editable={!isSaving}
                style={styles.input}
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Cidade</Text>
              <Input
                placeholder="Cidade"
                value={city}
                onChangeText={setCity}
                editable={!isSaving}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estado</Text>
            <Input
              placeholder="Estado"
              value={state}
              onChangeText={setState}
              editable={!isSaving}
              style={styles.input}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Observações</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <Input
              placeholder="Informações adicionais sobre o cliente (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              editable={!isSaving}
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Apenas o nome é obrigatório. Se informar email ou documento, eles devem ser únicos no sistema.
                {'\n\n'}💡 Digite o CEP para preenchimento automático do endereço.
              </Text>
            </View>

            <View style={[styles.infoCard, styles.warningCard]}>
              <Ionicons name="warning-outline" size={20} color="#f59e0b" />
              <Text style={[styles.infoText, styles.warningText]}>
                Não é possível excluir clientes que possuem vendas associadas. Para excluir, remova as vendas primeiro.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isSaving}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, (!isFormValid || isSaving) && styles.saveButtonDisabled]}
            onPress={handleUpdate}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#fff5f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusToggleActive: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIndicatorActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  statusText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  statusTextActive: {
    color: "#22c55e",
    fontWeight: "600",
  },
  formSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
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
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  infoSection: {
    gap: 12,
    marginTop: 16,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  warningCard: {
    backgroundColor: "#fffbeb",
    borderLeftColor: "#f59e0b",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
    marginLeft: 12,
  },
  warningText: {
    color: "#92400e",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: "auto",
    paddingTop: 20,
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
