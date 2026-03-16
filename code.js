import React, { useState } from "react";
import {View,Text,TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert,} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import Syps from "./syps";
import { supabase } from './supabaseclient'

function LoginScreen({ navigation }) {  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  if (!email.includes("@gmail.com")) {
    Alert.alert("Error", "Please enter a valid email address");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (error) {
    Alert.alert("Login Failed", error.message);
    return;
  }

  if (data?.user) {
    Alert.alert("Success", "Login successful!", [
      {
        text: "OK",
        onPress: () => navigation.navigate("syps"),
      },
    ]);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book" size={120} color="#ffd54f" />
        <Text style={styles.title}>Library App</Text>
        <Text style={styles.subtitle}>Login to your account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person" size={20} color="#fff" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#d9f2ef"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#fff" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#d9f2ef"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotWrapper}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createBtnDark}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.createText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
/*REGISTER*/

function CreateAccount({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [room, setRoom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const isFormValid =
    fullName && room && email && role && password && agree;

const handleSignUp = async () => {
  if (!isFormValid) {
    Alert.alert("Error", "Please complete all fields");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: {
        full_name: fullName,
        room: room,
        role: role,
      },
    },
  });

  if (error) {
    Alert.alert("Sign Up Failed", error.message);
    return;
  }

  Alert.alert(
    "Success",
    "Account created! Please check your email to verify.",
    [
      {
        text: "OK",
        onPress: () => navigation.navigate("Login"),
      },
    ]
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Ionicons name="book" size={100} color="#ffd54f" />
        <Text style={styles.title}>Library App</Text>
        <Text style={styles.subtitle}>Create your account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person" size={20} color="#fff" />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#d9f2ef"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="school" size={20} color="#fff" />
          <TextInput
            style={styles.input}
            placeholder="Grade&Section"
            placeholderTextColor="#d9f2ef"
            value={room}
            onChangeText={setRoom}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={20} color="#fff" />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#d9f2ef"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="briefcase" size={20} color="#fff" />
          <Picker
            selectedValue={role}
            style={styles.picker}
            dropdownIconColor="#fff"
            onValueChange={(value) => setRole(value)}
          >
            <Picker.Item label="Select Role" value="" />
            <Picker.Item label="Student" value="Student" />
            <Picker.Item label="Teacher" value="Teacher" />
            <Picker.Item label="Librarian" value="Librarian" />
          </Picker>
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#fff" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#d9f2ef"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgree(!agree)}
        >
          <Ionicons
            name={agree ? "checkbox" : "square-outline"}
            size={20}
            color="#ffd54f"
          />
          <Text style={styles.checkboxText}>
            I agree to the Terms & Privacy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createBtn,
            { opacity: isFormValid ? 1 : 0.5 },
          ]}
          disabled={!isFormValid}
          onPress={handleSignUp}
        >
          <Text style={styles.createText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* NAVIGATION */
const Stack = createNativeStackNavigator();

export default function App() {
  return (
      
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={CreateAccount} />
         <Stack.Screen name="syps" component={Syps} />
      </Stack.Navigator>
    </NavigationContainer>
   
  );
}

/*CSS*/

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#784890" },
  header: { flex: 1.2, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "bold", color: "#ffd54f" },
  subtitle: { fontSize: 14, color: "#fff" },
  form: { flex: 2, paddingHorizontal: 25, marginTop: 20 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 15,
  },
  input: { flex: 1, marginLeft: 10, color: "#fff" },
  picker: { flex: 1, color: "#fff", marginLeft: 10 },
  loginBtn: {
    backgroundColor: "#1b62cc",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: { color: "#fff", fontWeight: "bold" },
  forgotWrapper: { alignItems: "center", marginVertical: 10 },
  forgot: { color: "#e0f7fa" },
  createBtn: {
    backgroundColor: "#1b62cc",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  createBtnDark: {
    backgroundColor: "#000",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  createText: { color: "#fff", fontWeight: "bold" },
  backBtn: { position: "absolute", top: 40, left: 15 },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxText: { marginLeft: 8, color: "#fff", fontSize: 13 },
})