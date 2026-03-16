import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert,} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Syps from "./syps";
import { supabase } from "./supabaseclient";

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: "cuterheymart://reset-password",
      }
    );

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Password Reset",
        "Check your email for password reset instructions."
      );
    }
  };

  return (
   <LinearGradient
    colors={["#5de0e6", "#004aad"]}
   start={{ x: 0, y: 0.5 }}
   end={{ x: 1, y: 0.5 }}
   style={styles.container}
>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Ionicons name="book" size={120} color="#ffd54f" />
          <Text style={styles.title}>LibriQuest</Text>
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

          <TouchableOpacity
            style={styles.forgotWrapper}
            onPress={handleForgotPassword}
          >
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
    </LinearGradient>
  );
}

function CreateAccount({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const isFormValid = email && password && agree;

  const handleSignUp = async () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please complete all fields");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      Alert.alert("Sign Up Failed", error.message);
      return;
    }

    Alert.alert(
      "Success",
      "Account created! Please check your email to verify.",
      [{ text: "OK", onPress: () => navigation.navigate("Login") }]
    );
  };

  return (
    <LinearGradient
      colors={["#5de0e6", "#004aad", ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Ionicons name="book" size={100} color="#ffd54f" />
          <Text style={styles.title}>LibriQuest</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.form}>
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
              color="#050505"
            />
            <Text style={styles.checkboxText}>
              I agree to the Terms & Privacy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createBtn, { opacity: isFormValid ? 1 : 0.5 }]}
            disabled={!isFormValid}
            onPress={handleSignUp}
          >
            <Text style={styles.createText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* RESET PASSWORD SCREEN */
function ResetPasswordScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Password updated!");
      navigation.navigate("Login");
    }
  };

  return (
    <LinearGradient
    colors={["#5de0e6", "#004aad"]}
    start={{ x: 0, y: 0.5 }}
    end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10, color: "#fff" }}>
          Enter new password
        </Text>

        <TextInput
          placeholder="New Password"
          placeholderTextColor="#ddd"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.resetInput}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#ddd"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.resetInput}
        />

        <TouchableOpacity onPress={handleReset} style={styles.loginBtn}>
          <Text style={styles.loginText}>Reset Password</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
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
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { 
    fontSize: 30,
    fontWeight: "bold",
    color: "#fcc308" },
    subtitle: { 
    fontSize: 14, 
    color: "#fff" 
  },
  form: { 
    flex: 2, 
    paddingHorizontal: 25, 
    marginTop: 20 
  },
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
  input: { 
    flex: 1, 
    marginLeft: 10, 
    color: "#fff"
 },
  loginBtn: {
    backgroundColor: "#1766dd",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: { 
    color: "#fff",
    fontWeight: "bold" 
  },
  forgotWrapper: { 
    alignItems: "center",
    marginVertical: 10 
  },
  forgot: {
    color: "#e0f7fa"
 },
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
  createText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 15,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxText: {
    marginLeft: 8, 
    color: "#fff",
    fontSize: 13 
  },
  resetInput: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    color: "#fff",
  },
});