import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BackButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backButton}
    >
      <Ionicons name="chevron-back" size={24} color="white" />
    </TouchableOpacity>
  );
};

const styles = {
  backButton: {
    marginRight: 16,
  },
};

export default BackButton;
