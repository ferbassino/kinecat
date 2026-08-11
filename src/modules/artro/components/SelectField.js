import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SelectField = ({
  label,
  placeholder,
  value,
  options = [],
  onSelect,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((item) => item.value === value);
  const displayValue = selectedOption?.label || selectedOption?.value || value;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? displayValue : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const optionValue = option.value ?? option;
                const optionLabel =
                  option.label ??
                  (typeof optionValue === "string"
                    ? optionValue.charAt(0).toUpperCase() + optionValue.slice(1)
                    : String(optionValue));

                return (
                  <TouchableOpacity
                    key={String(option.key ?? optionValue)}
                    style={[
                      styles.option,
                      value === optionValue && styles.optionSelected,
                    ]}
                    onPress={() => {
                      onSelect(optionValue);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === optionValue && styles.optionTextSelected,
                      ]}
                    >
                      {optionLabel}
                    </Text>
                    {value === optionValue ? (
                      <Ionicons name="checkmark" size={18} color="#a855f7" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  field: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldDisabled: { opacity: 0.5 },
  fieldText: { color: "#ffffff", fontSize: 15, flex: 1 },
  placeholder: { color: "rgba(255,255,255,0.4)" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  optionsList: { paddingHorizontal: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionSelected: { backgroundColor: "rgba(168, 85, 247, 0.15)" },
  optionText: { color: "rgba(255,255,255,0.85)", fontSize: 15 },
  optionTextSelected: { color: "#a855f7", fontWeight: "600" },
});

export default SelectField;
