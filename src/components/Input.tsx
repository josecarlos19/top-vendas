import { TextInput, StyleSheet, TextInputProps } from "react-native";

export function Input(props: TextInputProps) {
  return <TextInput style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 7,
    paddingHorizontal: 16,
  },
});
