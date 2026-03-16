import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import {View,Text,StyleSheet,ScrollView,Image,TouchableOpacity,SafeAreaView,Alert,TextInput,Modal,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from './supabaseclient'

/* ================= CONTEXT ================= */
const LibraryContext = createContext();
function LibraryProvider({ children }) {
const [borrowed, setBorrowed] = useState([]);
const [notifications, setNotifications] = useState([]);

return (
<LibraryContext.Provider
value={{ borrowed, setBorrowed, notifications, setNotifications }}>
{children}
</LibraryContext.Provider>
);
}

/* ================= BORROW FORM MODAL COMPONENT ================= */
function BorrowFormModal({ visible, onClose, bookDetails, onConfirm }) {
const [fullName, setFullName] = useState("");
const [section, setSection] = useState("");
const [date, setDate] = useState("");
const [quantity, setQuantity] = useState(1);
const dateInputRef = useRef(null);
useEffect(() => {
if (visible) {
setFullName("");
setSection("");
setDate("");
setQuantity(1)
}
}, [visible]);

const handleConfirm = () => {
if (!fullName || !section || !date) {
Alert.alert("Error", "Please fill in all details.");
return;
}
if (date.length !== 10) {
Alert.alert("Invalid Date", "Please use MM/DD/YYYY format.");
return;
}
if (quantity < 1) {
Alert.alert("Invalid Quantity", "Quantity must be at least 1.");
return;
}
if (bookDetails.remaining !== undefined && quantity > bookDetails.remaining) {
Alert.alert("Quantity Exceeded", `Only ${bookDetails.remaining} copies available.`);
return;
}
onConfirm({ fullName, section, date, quantity });
};

const handleDateChange = (input) => {
let cleanInput = input.replace(/\D/g, '');
if (cleanInput.length > 8) cleanInput = cleanInput.slice(0, 8);

let formatted = '';
for (let i = 0; i < cleanInput.length; i++) {
if (i === 2 || i === 4) {
formatted += '/';
}
formatted += cleanInput[i];
}

setDate(formatted);
};

const incrementQuantity = () => {
  if (quantity < 50 && (!bookDetails.remaining || quantity < bookDetails.remaining)) {
    setQuantity(quantity + 1);
  }
};

const decrementQuantity = () => {
  if (quantity > 1) {
    setQuantity(quantity - 1);
  }
};

return (
<Modal
animationType="slide"
transparent={true}
visible={visible}
onRequestClose={onClose}
>
<View style={modalStyles.centeredView}>
<View style={modalStyles.modalView}>
{/* Header of Modal */}
<Text style={modalStyles.modalTitle}>Complete Borrowing</Text>

{/* Form Fields */}

{/* Book Name (Auto-filled based on selected book) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Title</Text>
<TextInput
style={modalStyles.input}
value={bookDetails?.title || ""}
editable={false}
placeholder="Title"
/>
</View>

{/* Author (Auto-filled) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Author</Text>
<TextInput
style={modalStyles.input}
value={bookDetails?.author || ""}
editable={false}
placeholder="Author"
/>
</View>

{/* Publisher (Auto-filled) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Publisher</Text>
<TextInput
style={modalStyles.input}
value={bookDetails?.publisher || ""}
editable={false}
placeholder="Publisher"
/>
</View>

{/* Full Name (User Input) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Full Name</Text>
<TextInput
style={modalStyles.input}
placeholder="Enter your fullName"
value={fullName}
onChangeText={setFullName}
/>
</View>

{/* Section (User Input) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Section</Text>
<TextInput
style={modalStyles.input}
placeholder="eg.,12-Bababge"
value={section}
onChangeText={setSection}
/>
</View>

{/* Date (User Input with Icon) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Date</Text>

{/* Container for Input + Icon */}
<View style={modalStyles.dateContainer}>
<TextInput
ref={dateInputRef}
style={modalStyles.dateInput}
placeholder="MM/DD/YYYY"
value={date}
onChangeText={handleDateChange}
maxLength={10} // Limit to MM/DD/YYYY
keyboardType="numeric" // Show number pad
/>

{/* Icon Button */}
<TouchableOpacity
style={modalStyles.iconButton}
onPress={() => dateInputRef.current?.focus()} // Focus input when icon is clicked
activeOpacity={0.7}
>
<Ionicons name="calendar-outline" size={24} color="#5B5FFF" />
</TouchableOpacity>
</View>
</View>

<View style={modalStyles.inputGroup}>
  <Text style={modalStyles.label}>Quantity</Text>
  <View style={modalStyles.quantityContainer}>
    <TouchableOpacity onPress={decrementQuantity} style={modalStyles.qtyButton}>
      <Text style={modalStyles.qtyButtonText}>−</Text>
    </TouchableOpacity>
    <Text style={modalStyles.qtyValue}>{quantity}</Text>
    <TouchableOpacity onPress={incrementQuantity} style={modalStyles.qtyButton}>
      <Text style={modalStyles.qtyButtonText}>+</Text>
    </TouchableOpacity>
  </View>
</View>


{/* Buttons */}
<View style={modalStyles.buttonRow}>
<TouchableOpacity
style={[modalStyles.button, modalStyles.cancelButton]}
onPress={onClose}
>
<Text style={modalStyles.cancelText}>Cancel</Text>
</TouchableOpacity>

<TouchableOpacity
style={[modalStyles.button, modalStyles.confirmButton]}
onPress={handleConfirm}
>
<Text style={modalStyles.confirmText}>Confirm Borrow</Text>
</TouchableOpacity>
</View>
</View>
</View>
</Modal>
);
}

/* ================= Home ================= */
function HomeScreen() {
const navigation = useNavigation();
const { borrowed, setBorrowed, setNotifications } = useContext(LibraryContext);

const handleLogout = async () => {
Alert.alert(
"Logout",
"Are you sure you want to logout?",
[
{ text: "Cancel", style: "cancel" },
{
text: "Logout",
style: "destructive",
onPress: async () => {
const { error } = await supabase.auth.signOut();

if (error) {
Alert.alert("Error", "Failed to logout.");
} else {
navigation.replace("Login");
}
},
},
]
);
};

// 🔥 FETCH ACTIVE BORROWS FROM DATABASE
const fetchActiveBorrows = async () => {
try {
const { data, error } = await supabase.rpc('get_my_borrowed_books');

if (error) {
console.log("Fetch error:", error);
return;
}

if (data) {

setBorrowed(data);
}
} catch (err) {
console.log(err);
}
};

const toggleBorrow = (title) => {
const time = new Date().toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
});

if (borrowed.includes(title)) {
setBorrowed(borrowed.filter((b) => b !== title));
setNotifications((prev) => [
{
type: "success",
title: "Returned",
message: `"${title}" returned successfully`,
time,
},
...prev,
]);
Alert.alert("Returned", title);
} else {
setBorrowed([...borrowed, title]);
setNotifications((prev) => [
{
type: "success",
title: "Borrowed",
message: `You borrowed "${title}"`,
time,
},
...prev,
]);
Alert.alert("Borrowed", title);
}
};

const handleManageBorrow = async (bookTitle) => {
Alert.alert("Manage Book", `Choose an action for "${bookTitle}"`, [
{ text: "Cancel", style: "cancel" },
{
text: "Return",
onPress: async () => {
try {
const {
data: { user },
} = await supabase.auth.getUser();

if (!user) {
Alert.alert("Error", "User not logged in");
return;
}
const { error } = await supabase
.from("borrow_books")
.update({
returned: true,
returned_at: new Date().toISOString(),
})
.eq("title", bookTitle)
.eq("user_id", user.id)
.eq("returned", false);

if (error) {
console.log(error);
Alert.alert("Error", "Failed to return book");
return;
}
setBorrowed(borrowed.filter((b) => b !== bookTitle));
Alert.alert("Success", "Book returned successfully!");
} catch (err) {
console.log(err);
Alert.alert("Error", "Something went wrong.");
}
},
},
]);
};

return (
<SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FF" }}>

<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
{/* HEADER */}
<View style={styles.topHeader}>
{/* LEFT SIDE */}
<View style={styles.logoRow}>
<View style={styles.logoBox} >
<Ionicons name="book" size={18} color="#ffd54f" />
</View>
<Text style={styles.appName}>LibriQuest</Text>
</View>

{/* RIGHT SIDE */}
<View style={styles.headerIcons}>
<TouchableOpacity
onPress={() => navigation.navigate("Alerts")}
style={styles.iconButtonHeader}
>
<Ionicons name="notifications-outline" size={24} color="#333" />
</TouchableOpacity>

<TouchableOpacity onPress={handleLogout}>
<Ionicons name="log-out-outline" size={24} color="#333" />
</TouchableOpacity>
</View>
</View>


<Text style={styles.subtitle}>

Welcome to LibriQuest.
</Text>

{/* STATS */}
<View style={styles.statsRow}>
<StatCard title="Borrowed" value={borrowed.length} />
<StatCard title="Books Available" value={5 - borrowed.length} />
</View>

<View style={styles.statsRow}>
<StatCard title="Due Soon" value="0" />
<StatCard title="Total Books" value="8" />
</View>

{/* RECOMMENDATIONS */}
<View style={styles.sectionHeader}>
<Text style={styles.sectionTitle}>Recommendations</Text>
</View>

<ScrollView horizontal showsHorizontalScrollIndicator={false}>
<BookCard
title="The Great Gatsby"
author="F. Scott Fitzgerald"
category="Classic"
image="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f"
isBorrowed={borrowed.includes("The Great Gatsby")}
onToggle={() => toggleBorrow("The Great Gatsby")}
/>
<BookCard
title="Clean Code"
author="Robert C. Martin"
category="Technology"
image="https://images.unsplash.com/photo-1515879218367-8466d910aaa4"
isBorrowed={borrowed.includes("Clean Code")}
onToggle={() => toggleBorrow("Clean Code")}
/>
</ScrollView>
</ScrollView>
</SafeAreaView>
);
}

/* ================= NOTIFICATIONS ================= */
function NotificationsScreen() {
const { notifications, setNotifications } = useContext(LibraryContext);

return (
<SafeAreaView style={{ flex: 1 }}>
<View style={notif.header}>
<Text style={notif.headerTitle}>Notifications</Text>
<TouchableOpacity onPress={() => setNotifications([])}>
<Text style={notif.markRead}>Mark all read</Text>
</TouchableOpacity>
</View>

<ScrollView>
{notifications.length === 0 ? (
<Text style={{ textAlign: "center", marginTop: 40, color: "#777" }}>
No notifications
</Text>
) : (
notifications.map((item, index) => <NotificationCard key={index} {...item} />)
)}
</ScrollView>
</SafeAreaView>
);
}

/* ================= COMPONENTS ================= */
function StatCard({ title, value }) {
return (
<View style={styles.statCard}>
<Text style={styles.statValue}>{value}</Text>
<Text style={styles.statTitle}>{title}</Text>
</View>
);
}

function BookCard({ title, author, category, image, isBorrowed }) {
return (
<View style={styles.bookCard}>
{/* Book Image */}
<View style={styles.imageWrapper}>
<Image source={{ uri: image }} style={styles.bookImage} />
</View>

{/* Book Info */}
<Text style={styles.bookTitle}>{title}</Text>
<Text style={styles.bookAuthor}>{author}</Text>
<Text style={styles.bookCategory}>{category}</Text>

{/* Status + Borrow Button */}

<View>
<TouchableOpacity
activeOpacity={0.7}
disabled={isBorrowed}
style={{
paddingVertical: 6,
paddingHorizontal: 12,
borderRadius: 6,
}}
>
</TouchableOpacity>
</View>
</View>
);
}

function BorrowItem({ title, onManage }) {
return (
<View style={styles.borrowCard}>
<View>
<Text style={styles.borrowTitle}>{title}</Text>
<Text style={styles.borrowDue}>Due: 1/22/2026</Text>
</View>
<TouchableOpacity onPress={onManage}>
<Text style={styles.manage}>Manage</Text>
</TouchableOpacity>
</View>
);
}

function NotificationCard({ title, message, time }) {
return (
<View style={notif.card}>
<Ionicons name="checkmark-circle" size={22} color="#00A86B" />
<View style={{ flex: 1, marginLeft: 10 }}>
<Text style={notif.cardTitle}>{title}</Text>
<Text style={notif.cardMessage}>{message}</Text>
</View>
<Text style={notif.time}>{time}</Text>
</View>
);
}

/* ================= NAVIGATION ================= */
const Tab = createBottomTabNavigator();

export default function Syps() {
return (
<LibraryProvider>
<Tab.Navigator
screenOptions={{
headerShown: false,
tabBarActiveTintColor: "#5B5FFF",
tabBarInactiveTintColor: "#777",
}}
>
<Tab.Screen
name="Home"
component={HomeScreen}
options={{
tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
}}
/>


<Tab.Screen
name="Search"
component={SearchScreen}
options={{
tabBarIcon: ({ color }) => <Ionicons name="search" size={22} color={color} />
}}
/>


<Tab.Screen
name="Library"
component={LibraryScreen}
options={{
tabBarIcon: ({ color }) => <Ionicons name="library" size={22} color={color} />,
}}
/>

<Tab.Screen
name="Alerts"
component={NotificationsScreen}
options={{
tabBarIcon: ({ color }) => <Ionicons name="notifications" size={22} color={color} />,
}}
/>

<Tab.Screen
name="Dashboard"
component={DashboardScreen}
options={{
tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} />,
}}
/>

</Tab.Navigator>
</LibraryProvider>
);
}

/* ================= SEARCH SCREEN (WITH MODAL) ================= */
function SearchScreen() {
const { borrowed, setBorrowed, setNotifications } = useContext(LibraryContext);
const navigation = useNavigation();

const [books, setBooks] = useState([]);
const [query, setQuery] = useState("");
const [activeCategory, setActiveCategory] = useState("All");

// State Modal
const [isModalVisible, setModalVisible] = useState(false);
const [selectedBook, setSelectedBook] = useState(null);

useEffect(() => {
fetchBooks();
}, []);

const fetchBooks = async () => {
const { data, error } = await supabase
.from("books")
.select("*");

if (error) {
console.log(error);
} else {
const formatted = data.map(book => ({
id: book.id,
category: book.category,
title: book.title,
author: book.author,
publisher: book.publisher,
desc: book.description,
img: book.image,
remaining: book.remaining

}));

setBooks(formatted);
}
};
const filtered = books.filter((b) => {
const matchCategory =
activeCategory === "All" || b.category === activeCategory.toUpperCase();
const matchSearch =
b.title.toLowerCase().includes(query.toLowerCase()) ||
b.author.toLowerCase().includes(query.toLowerCase());
return matchCategory && matchSearch;
});

const handleBorrowPress = (book) => {
setSelectedBook(book);
setModalVisible(true);
};

const handleConfirmBorrow = async (formData) => {
try {
const { fullName, section, date, quantity } = formData;
console.log("BOOK DETAILS:", selectedBook);
console.log("FULL NAME:", fullName);
console.log("SECTION:", section);
console.log("DATE:", date);
console.log("QUANTITY:", quantity);

// Format date for Supabase
const formatDateForDB = (inputDate) => {
const [month, day, year] = inputDate.split("/");
const dateObj = new Date(year, month - 1, day);
return dateObj.toISOString();

};
const formattedDate = formatDateForDB(date);

// Get current user
const {
data: { user },
error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
Alert.alert("Error", "You must be logged in.");
return;
}

// Insert into Supabase
const { data, error } = await supabase
.from("borrow_books")
.insert([
{
user_id: user.id,
title: selectedBook.title,
author: selectedBook.author,
publisher: selectedBook.publisher,
full_name: fullName,
section: section,
date_borrowed: formattedDate,
quantity: quantity,
},
])
.select();

if (error) {
console.log("Supabase insert error:", error);
Alert.alert("Error", "Failed to borrow book.");
return;
}
if (!error) {

// GET CURRENT BOOK
const { data: bookData, error: bookError } = await supabase
.from("books")
.select("borrowed_count, quantity, remaining")
.eq("id", selectedBook.id)
.single();

if (bookError) {
console.log(bookError);
return;
}

const newBorrowed = bookData.borrowed_count + quantity;
const newRemaining = bookData.quantity - newBorrowed;

// UPDATE BOOK COUNTS
const { error: updateError } = await supabase
.from("books")
.update({
borrowed_count: newBorrowed,
remaining: newRemaining
})
.eq("id", selectedBook.id);

if (updateError) {
console.log(updateError);
}
}

setBorrowed([...borrowed, selectedBook.title]);

const time = new Date().toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
});

setNotifications((prev) => [
{
type: "success",
title: "Borrowed",
message: `You borrowed ${quantity} copy(ies) of "${selectedBook.title}"`,
time,
},
...prev,
]);

setModalVisible(false);
Alert.alert("Success", `${quantity} copy(ies) borrowed successfully!`);
} catch (err) {
console.log(err);
Alert.alert("Error", "Something went wrong.");
}
};

return (
<SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FF" }}>
<ScrollView style={{ padding: 16 }}>
{/* SEARCH BAR */}
<View style={searchBar}>
<Ionicons name="search" size={18} color="#777" />
<TextInput
style={{ flex: 1, marginLeft: 10 }}
placeholder="Search books, authors..."
value={query}
onChangeText={setQuery}
/>
</View>

{/* CATEGORY PILLS */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
{["All", "Technology", "Science", "Fiction", "History"].map((c) => (
<TouchableOpacity key={c} onPress={() => setActiveCategory(c)}>
<View style={[pill, activeCategory === c && pillActive]}>
<Text style={{ fontWeight: "600", color: activeCategory === c ? "#fff" : "#555" }}>
{c}
</Text>
</View>
</TouchableOpacity>
))}
</ScrollView>

{/* LIBRARY CATALOG HEADER */}
<View style={catalogHeader}>
<Text style={catalogTitle}>Library Catalog</Text>
<Text style={catalogCount}>{filtered.length} Books</Text>
</View>

{/* LIST */}
{filtered.map((b, i) => {
const isBorrowed = borrowed.some(item => item.title === b.title);
return (
<View key={i} style={catalogCard}>
<Image source={{ uri: b.img }} style={catalogImg} />

<View style={{ flex: 1, marginLeft: 12 }}>
<Text style={catalogCategory}>{b.category}</Text>
<Text style={catalogBookTitle}>{b.title}</Text>

<Text style={catalogAuthor}>{b.author}</Text>
<Text style={catalogDesc}>{b.desc}</Text>

{/* Status Text */}

<Text
style={{
color: b.remaining === 0 ? "#ff4444" : "#00C851",
fontWeight: "700",
fontSize: 14,
marginTop: 2,

}}
>
{b.remaining === 0 ? "UNAVAILABLE" : `AVAILABLE (${b.remaining})`}
</Text>

{/* Button Logic */}
{isBorrowed ? (
<TouchableOpacity style={[borrowBtn, { backgroundColor: '#ccc' }]} disabled>
<Text style={{ color: "#fff", fontWeight: "700" }}>Borrowed</Text>
</TouchableOpacity>
) : (
<View style={{ alignItems: "flex-end", marginTop: 6 }}>
<TouchableOpacity
style={borrowBtn}
onPress={() => handleBorrowPress(b)}
>
<Text style={{ color: "#fff", fontWeight: "700" }}>Borrow</Text>
</TouchableOpacity>
</View>
)}
</View>
</View>
);
})}
</ScrollView>

<BorrowFormModal
visible={isModalVisible}
onClose={() => setModalVisible(false)}
bookDetails={selectedBook}
onConfirm={handleConfirmBorrow}
/>
</SafeAreaView>
);
}

/* ================= LibraryPLACEHOLDERS================= */
function LibraryScreen() {
const [books, setBooks] = useState([]);

useEffect(() => {
fetchBooks();
}, []);

const fetchBooks = async () => {
const { data, error } = await supabase.from("books").select("*");
if (error) {
console.log("Error fetching books:", error);
} else {
setBooks(data);
}
};

return (
<SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FF", padding: 16 }}>
<ScrollView>
<Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12, marginTop:25 }}>
List of Books
</Text>

{books.length === 0 ? (
<Text style={{ color: "#777", marginTop: 20 }}>No books available</Text>
) : (
books.map((book) => (
<View
key={book.id}
style={{
flexDirection: "row",
backgroundColor: "#fff",
borderRadius: 12,
padding: 12,
marginBottom: 12,
alignItems: "center",
}}
>
<Image
source={{ uri: book.image }}
style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: "#ddd" }}
/>
<View style={{ flex: 1, marginLeft: 12 }}>
<Text style={{ fontWeight: "700" }}>{book.title}</Text>
<Text style={{ color: "#555", fontSize: 12 }}>{book.author}</Text>
<Text style={{ color: "#5B5FFF", fontSize: 12 }}>{book.category}</Text>
<Text style={{ color: "#777", fontSize: 12 }}>{book.description}</Text>
</View>
</View>
))
)}
</ScrollView>
</SafeAreaView>
);
}

/* ================= wwwDashboard================= */
function DashboardScreen() {
const { borrowed, setBorrowed,} = useContext(LibraryContext);
const [loading, setLoading] = useState(true);



useFocusEffect(
React.useCallback(() => {
fetchBorrowedBooks();
}, [])
);

const fetchBorrowedBooks = async () => {
try {
const {
data: { user }
} = await supabase.auth.getUser();

if (!user) return;

const { data, error } = await supabase
.from("borrow_books")
.select("*")
.eq("user_id", user.id)
.eq("returned", false);

if (error) {
console.log(error);
return;
}

setBorrowed(data || []);
setLoading(false);
} catch (err) {
console.log(err);
}
};

const handleReturn = async (item) => {

// UPDATE BORROW RECORD
const { error } = await supabase
.from("borrow_books")
.update({
returned: true,
returned_at: new Date().toISOString(),
})
.eq("id", item.id);

if (error) {
console.log(error);
return;
}

// GET BOOK DATA
const { data: bookData, error: bookError } = await supabase
.from("books")
.select("borrowed_count, quantity")
.eq("title", item.title)
.single();

if (bookError) {
console.log(bookError);
return;
}

const newBorrowed = bookData.borrowed_count - 1;
const newRemaining = bookData.quantity - newBorrowed;

// UPDATE BOOK TABLE
const { error: updateError } = await supabase
.from("books")
.update({
borrowed_count: newBorrowed,
remaining: newRemaining
})
.eq("title", item.title);

if (updateError) {
console.log(updateError);
}

fetchBorrowedBooks();
Alert.alert("Success", "Book returned!");
};

const handleDelete = async (item) => {
const { error } = await supabase
.from("borrow_books")
.delete()
.eq("id", item.id);

if (!error) {
fetchBorrowedBooks();
Alert.alert("Deleted", "Record removed");
}
};

return (
<SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FF" }}>
<ScrollView style={{ padding: 16 }}>
<Text style={dash.title}>Dashboard</Text>

{loading ? (
<Text>Loading...</Text>
) : borrowed.length === 0 ? (
<Text style={{ color: "#777", marginTop: 20 }}>
No borrowed books
</Text>
) : (
borrowed.map((item) => (
<View key={item.id} style={dash.card}>

{/* USER INFO */}
<View style={dash.userRow}>
<View style={dash.avatar}>
<Ionicons name="person" size={18} color="#fff" />
</View>

<View>
<Text style={dash.userName}>
{item.full_name}
</Text>
<Text style={dash.section}>
{item.section}
</Text>
</View>
</View>


<View style={dash.bookBox}>
<Text style={dash.bookTitle}>{item.title}</Text>
<Text style={dash.bookAuthor}>{item.author}</Text>
<Text style={dash.bookPublisher}>{item.publisher}</Text>
</View>


<View style={dash.buttonRow}>
<TouchableOpacity
style={dash.returnBtn}
onPress={() => handleReturn(item)}
>
<Ionicons name="checkmark" size={16} color="#fff" />
<Text style={dash.btnText}>Return</Text>
</TouchableOpacity>

<TouchableOpacity
style={dash.deleteBtn}
onPress={() => handleDelete(item)}
>
<Ionicons name="trash" size={16} color="#fff" />
<Text style={dash.btnText}>Delete</Text>
</TouchableOpacity>
</View>
</View>
))
)}
</ScrollView>
</SafeAreaView>
);
}
const dash = StyleSheet.create({
title: {
fontSize: 22,
fontWeight: "700",
marginTop: 25,
marginBottom: 16,
color: "#333",
},
card: {
backgroundColor: "#fff",
borderRadius: 12,
padding: 16,
marginBottom: 12,
shadowColor: "#000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 3,
},
userRow: {
flexDirection: "row",
alignItems: "center",
marginBottom: 12,
},
avatar: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: "#5B5FFF",
justifyContent: "center",
alignItems: "center",
marginRight: 12,
},
userName: {
fontWeight: "700",
fontSize: 14,
},
section: {
fontSize: 12,
color: "#555",
},
bookBox: {
marginBottom: 12,
},
bookTitle: {
fontWeight: "700",
fontSize: 16,
marginBottom: 4,
},
bookAuthor: {
fontSize: 12,
color: "#555",
},
buttonRow: {
flexDirection: "row",
justifyContent: "space-between",
},
returnBtn: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#00C851",
paddingVertical: 6,
paddingHorizontal: 12,
borderRadius: 8,
},
deleteBtn: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#ff4444",
paddingVertical: 6,
paddingHorizontal: 12,
borderRadius: 8,
},
btnText: {
color: "#fff",
fontWeight: "700",
marginLeft: 6,
fontSize: 12,
},
});

const styles = StyleSheet.create({
container: {
padding: 16,
paddingBottom: 90,
},

topHeader: {
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
paddingTop: 15,
marginTop: 5,
},

headerIcons: {
flexDirection: "row",
alignItems: "center",
height: 30,
},
iconButtonHeader: {
padding: 6,
marginLeft: 12,

},
logoRow: {
flexDirection: "row",
alignItems: "center",
},

logoBox: {
backgroundColor: "#000000",
padding: 6,
borderRadius: 6,
},

appName: {
fontSize: 20,
fontWeight: "700",
marginLeft: 8,
},

subtitle: {
color: "#000000",
marginBottom: 24,
marginTop: 12,
fontSize:22,
},

statsRow: {
flexDirection: "row",
justifyContent: "space-between",
marginBottom: 12,
},

statCard: {
width: "48%",
backgroundColor: "#fff",
padding: 15,
borderRadius: 16,
},

statValue: {
fontSize: 22,
fontWeight: "700",
},

statTitle: {
fontSize: 13,
color: "#555",
},

sectionHeader: {
flexDirection: "row",
justifyContent: "space-between",
marginVertical: 16,
},

sectionTitle: {
fontSize: 18,
fontWeight: "600",
},

bookCard: {
backgroundColor: "#fff",
width: 220,
borderRadius: 16,
padding: 12,
marginRight: 12,
},

imageWrapper: {
height: 140,
marginBottom: 12,
},

bookImage: {
width: "100%",
height: "100%",
borderRadius: 12,
backgroundColor: "#ddd",
},

bookTitle: {
fontWeight: "700",
fontSize: 16,
marginBottom: 4,
},

bookAuthor: {
fontSize: 12,
color: "#555",
marginBottom: 4,
},

bookCategory: {
fontSize: 12,
color: "#5B5FFF",
marginBottom: 8,
},

borrowCard: {
backgroundColor: "#fff",
padding: 14,
borderRadius: 14,
flexDirection: "row",
justifyContent: "space-between",
marginTop: 12,
},

borrowTitle: {
fontWeight: "700",
fontSize: 14,
},

borrowDue: {
fontSize: 12,
color: "#555",
},

manage: {
color: "#5B5FFF",
fontWeight: "700",
fontSize: 14,
marginTop:10,
},
});

/* ======= MODAL STYLES (WITH DATE ICON UPDATE) ======= */
const modalStyles = StyleSheet.create({
centeredView: {
flex: 1,
justifyContent: "center",
alignItems: "center",
backgroundColor: "rgba(0,0,0,0.5)",
},
modalView: {
width: "90%",
backgroundColor: "white",
borderRadius: 20,
padding: 20,
shadowColor: "#000",
shadowOffset: {
width: 0,
height: 2
},
shadowOpacity: 0.25,
shadowRadius: 4,
elevation: 5
},
modalTitle: {
fontSize: 20,
fontWeight: "bold",
marginBottom: 15,
textAlign: "center",
color: "#333"
},
inputGroup: {
marginBottom: 12,
},
label: {
fontSize: 14,
fontWeight: "600",
color: "#555",
marginBottom: 5,
},
input: {
height: 45,
borderWidth: 1,
borderColor: "#ddd",
borderRadius: 8,
paddingHorizontal: 10,
backgroundColor: "#f9f9f9",
color: "#333"
},
dateContainer: {
flexDirection: 'row',
alignItems: 'center',
height: 45,
borderWidth: 1,
borderColor: '#ddd',
borderRadius: 8,
backgroundColor: "#f9f9f9",
paddingHorizontal: 10,
},
dateInput: {
flex: 1,
height: 45,
color: "#333",
paddingVertical: 0,
},
iconButton: {
padding: 5,
marginLeft: 5,
},

quantityContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 6,
  paddingHorizontal: 12,
  paddingVertical: 6,
  marginTop: 4,
  backgroundColor: "#",
  width: 305, 
},

qtyButton: {
  backgroundColor: "#555",
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderRadius: 4,
},

qtyButtonText: {
  color: "white",
  fontSize: 15,
  fontWeight: "bold",
},

qtyValue: {
  marginHorizontal: 20,
  fontSize: 15,
  fontWeight: "600",
},

buttonRow: {
flexDirection: "row",
justifyContent: "space-between",
marginTop: 20,
},
button: {
flex: 1,
paddingVertical: 12,
borderRadius: 8,
alignItems: "center",
},
cancelButton: {
backgroundColor: "transparent",
borderWidth: 1,
borderColor: "#5B5FFF",
marginRight: 10,
},
cancelText: {
color: "#5B5FFF",
fontWeight: "bold",
},
confirmButton: {
backgroundColor: "#5B5FFF",
marginLeft: 10,
},
confirmText: {
color: "white",
fontWeight: "bold",
}
});

/* ======= SEARCH SCREEN STYLE ======= */
const searchBar = {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#fff",
padding: 12,
borderRadius: 12,
marginTop: 25,
};

const pill = {
backgroundColor: "#f0f0f0",
paddingVertical: 10,
paddingHorizontal: 14,
borderRadius: 20,
marginRight: 10,
};

const pillActive = {
backgroundColor: "#5B5FFF",
};

const catalogHeader = {
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
marginTop: 18,
};

const catalogTitle = {
fontSize: 18,
fontWeight: "700",
};

const catalogCount = {
color: "#777",
fontSize: 13,
};

const catalogCard = {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#fff",
padding: 10,
borderRadius: 14,
marginTop: 14,
};

const catalogImg = {
width: 60,
height: 60,
padding: 19,
borderRadius: 12,
backgroundColor: "#ddd",
};

const catalogCategory = {
color: "#5B5FFF",
fontWeight: "700",
fontSize: 12,
};

const catalogBookTitle = {
fontWeight: "700",
};

const catalogAuthor = {
color: "#777",
fontSize: 12,
};

const catalogDesc = {
color: "#777",
fontSize: 12,
};

const borrowBtn = {
backgroundColor: "#5B5FFF",
paddingVertical: 8,
paddingHorizontal: 14,
borderRadius: 20,
alignSelf: "flex-end",
};

/* ======= NOTIFICATIONS STYLE ======= */
const notif = StyleSheet.create({
header: {
padding: 16,
flexDirection: "row",
justifyContent: "space-between",
},

headerTitle: {
fontWeight: "700",
fontSize: 22,
marginTop: 15,
},

markRead: {
color: "#5B5FFF",
fontWeight: "700",
fontSize: 15,
marginTop: 20,
},

card: {
padding: 16,
flexDirection: "row",
alignItems: "center",
borderBottomWidth: 1,
borderBottomColor: "#eee",
},

cardTitle: {
fontWeight: "700",
fontSize: 16,
},

cardMessage: {
fontSize: 14,
color: "#666",
},

time: {
fontSize: 12,
color: "#999",
},
});