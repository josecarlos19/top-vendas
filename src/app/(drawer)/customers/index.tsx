import { Input } from "@/components/ActivityItem";
import { useCategoryDatabase } from "@/database/models/Category";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export default function CreateCategory() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const categoryDatabase = useCategoryDatabase();

  async function handleStore() {
    if (!name.trim()) {
      Alert.alert("Erro", "Por favor, preencha o nome da categoria.");
      return;
    }

    setIsLoading(true);
    try {
      await categoryDatabase.store({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      Alert.alert("Sucesso", "Categoria criada com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setName("");
            setDescription("");
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert("Erro", "Falha ao criar categoria. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

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
        <Text style={styles.title}>Nova Categoria</Text>

        <Input
          placeholder="Nome da categoria"
          value={name}
          onChangeText={setName}
          editable={!isLoading}
        />

        <Input
          placeholder="Descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!isLoading}
        />

        <Button
          title={isLoading ? "Salvando..." : "Salvar Categoria"}
          onPress={handleStore}
          disabled={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
});
