import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import {View,Text,StyleSheet,ScrollView,Image,TouchableOpacity,SafeAreaView,Alert,TextInput,Modal,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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

/* ================= BOOK DETAIL MODAL COMPONENT ================= */
function BookDetailModal({ visible, onClose, bookDetails, onBorrow }) {
return (
<Modal
animationType="fade"
transparent={true}
visible={visible}
onRequestClose={onClose}
>
<View style={bookDetailStyles.overlay}>
<View style={bookDetailStyles.container}>
<View style={bookDetailStyles.header}>
<Text style={bookDetailStyles.headerPlaceholder}></Text>
<TouchableOpacity onPress={onClose}>
<Ionicons name="close" size={24} color="#333" />
</TouchableOpacity>
</View>
<Image
source={{ uri: bookDetails?.img || bookDetails?.image }}
style={bookDetailStyles.bookImage}
/>
<View style={bookDetailStyles.content}>
<Text style={bookDetailStyles.title}>{bookDetails?.title || "Unknown Title"}</Text>

{/* Author */}
<View style={bookDetailStyles.metaRow}>
<Ionicons name="person-circle" size={18} color="#5B5FFF" />
<Text style={bookDetailStyles.metaText}>{bookDetails?.author || "Unknown"}</Text>
</View>

{/* Publisher */}
<View style={bookDetailStyles.metaRow}>
<Ionicons name="business" size={18} color="#5B5FFF" />
<Text style={bookDetailStyles.metaText}>{bookDetails?.publisher || "Unknown"}</Text>
</View>

{/* Availability */}
<View style={bookDetailStyles.availabilityContainer}>
<View style={bookDetailStyles.availabilityBadge}>
<Text style={bookDetailStyles.badgeText}>Available</Text>
</View>
<Text style={bookDetailStyles.copiesText}>
{bookDetails?.remaining || 0} of {bookDetails?.quantity || bookDetails?.remaining} copies
</Text>
</View>

{/* Description */}
<Text style={bookDetailStyles.description}>{bookDetails?.desc || bookDetails?.description || "No description available"}</Text>
</View>

{/* Buttons */}
<View style={bookDetailStyles.buttonContainer}>
<TouchableOpacity
style={bookDetailStyles.closeBtn}
onPress={onClose}
>
<Text style={bookDetailStyles.closeBtnText}>Close</Text>
</TouchableOpacity>

<TouchableOpacity
style={[
bookDetailStyles.borrowButton,
bookDetails?.remaining === 0 && bookDetailStyles.borrowButtonDisabled
]}
onPress={onBorrow}
disabled={bookDetails?.remaining === 0}
>
<Text style={bookDetailStyles.borrowButtonText}>
{bookDetails?.remaining === 0 ? "Unavailable" : "Borrow This Book"}
</Text>
</TouchableOpacity>
</View>
</View>
</View>
</Modal>
);
}

/* ================= BORROW FORM MODAL COMPONENT ================= */
function EditBorrowModal({ visible, onClose, item, onSave }) {
  const [fullName, setFullName] = useState("");
  const [section, setSection] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible && item) {
      setFullName(item.full_name || "");
      setSection(item.section || "");
      setQuantity(item.quantity || 1);
      
      if (item.date_borrowed) {
        const d = new Date(item.date_borrowed);
        d.setDate(d.getDate() + 14);
        setDueDate(d);
      }
    }
  }, [visible, item]);

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSave = () => {
    onSave({ 
      id: item.id,
      full_name: fullName.toUpperCase().trim(), 
      section: section.toUpperCase().trim(), 
      quantity,
      // Pass back the original borrow date but adjusted for the new due date if needed
      // or just the updated metadata
    });
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={editModalStyles.overlay}>
        <View style={editModalStyles.container}>
          <View style={editModalStyles.header}>
            <View>
              <Text style={editModalStyles.title}>Edit Borrow Record</Text>
              <Text style={editModalStyles.subtitle}>Update the borrow record details below.</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={editModalStyles.inputGroup}>
            <Text style={editModalStyles.label}>Borrower Name</Text>
            <TextInput
              style={[editModalStyles.input, editModalStyles.inputActive]}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="characters"
            />
          </View>

          <View style={editModalStyles.inputGroup}>
            <Text style={editModalStyles.label}>Grade & Section</Text>
            <TextInput
              style={editModalStyles.input}
              value={section}
              onChangeText={setSection}
              autoCapitalize="characters"
            />
          </View>

          <View style={editModalStyles.inputGroup}>
            <Text style={editModalStyles.label}>Quantity</Text>
            <TextInput
              style={editModalStyles.input}
              value={String(quantity)}
              keyboardType="numeric"
              onChangeText={(val) => setQuantity(parseInt(val) || 1)}
            />
          </View>

          <View style={editModalStyles.inputGroup}>
            <Text style={editModalStyles.label}>Due Date</Text>
            <TouchableOpacity 
              style={editModalStyles.dateRow} 
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={editModalStyles.dateText}>
                {dueDate.toLocaleDateString('en-PH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Ionicons name="calendar" size={18} color="#333" />
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <View style={editModalStyles.footer}>
            <TouchableOpacity style={editModalStyles.cancelBtn} onPress={onClose}>
              <Text style={editModalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={editModalStyles.saveBtn} onPress={handleSave}>
              <Text style={editModalStyles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BorrowFormModal({ visible, onClose, bookDetails, onConfirm }) {
const [fullName, setFullName] = useState("");
const [section, setSection] = useState("");
const [date, setDate] = useState(new Date());
const [showPicker, setShowPicker] = useState(false);
const [quantity, setQuantity] = useState(1);

useEffect(() => {
if (visible) {
setFullName("");
setSection("");
setDate(new Date());
setShowPicker(false);
setQuantity(1)
}
}, [visible]);

const onDateChange = (event, selectedDate) => {
  setShowPicker(false);
  if (selectedDate) {
    setDate(selectedDate);
  }
};

const handleConfirm = () => {
if (!fullName || !section || !date) {
Alert.alert("Error", "Please fill in all details.");
return;
}

// Ensure submission is uppercase and trimmed
const upperFullName = fullName.toUpperCase().trim();
const upperSection = section.toUpperCase().trim();

// Format date to MM/DD/YYYY for the callback
const formattedDateStr = date.toLocaleDateString('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
});

if (quantity < 1) {
Alert.alert("Invalid Quantity", "Quantity must be at least 1.");
return;
}
if (bookDetails.remaining !== undefined && quantity > bookDetails.remaining) {
Alert.alert("Quantity Exceeded", `Only ${bookDetails.remaining} copies available.`);
return;
}
onConfirm({ fullName: upperFullName, section: upperSection, date: formattedDateStr, quantity });
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
placeholder="ENTER YOUR FULLNAME"
value={fullName}
onChangeText={setFullName}
autoCapitalize="characters"
/>
</View>

{/* Section (User Input) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Section</Text>
<TextInput
style={modalStyles.input}
placeholder="EG., 12-BABBAGE"
value={section}
onChangeText={setSection}
autoCapitalize="characters"
/>
</View>

{/* Date (User Input with Icon) */}
<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Date</Text>

{/* Container for Input + Icon */}
<TouchableOpacity
style={editModalStyles.dateRow}
onPress={() => setShowPicker(true)}
activeOpacity={0.7}
>
<Text style={editModalStyles.dateText}>
{date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
</Text>
<Ionicons name="calendar" size={18} color="#333" />
</TouchableOpacity>

{showPicker && (
  <DateTimePicker
    value={date}
    mode="date"
    display="default"
    onChange={onDateChange}
  />
)}
</View>

<View style={modalStyles.inputGroup}>
<Text style={modalStyles.label}>Quantity</Text>
<View style={modalStyles.quantityControlContainer}>
<Text style={modalStyles.qtyValueText}>{quantity}</Text>
<View style={modalStyles.qtyArrowsContainer}>
<TouchableOpacity onPress={incrementQuantity} style={modalStyles.qtyArrowBtn}>
<Ionicons name="caret-up" size={14} color="#777" />
</TouchableOpacity>
<TouchableOpacity onPress={decrementQuantity} style={modalStyles.qtyArrowBtn}>
<Ionicons name="caret-down" size={14} color="#777" />
</TouchableOpacity>
</View>
</View>
</View>


{/* Buttons */}
<View style={editModalStyles.footer}>
<TouchableOpacity
style={editModalStyles.cancelBtn}
onPress={onClose}
>
<Text style={editModalStyles.cancelBtnText}>Cancel</Text>
</TouchableOpacity>

<TouchableOpacity
style={editModalStyles.saveBtn}
onPress={handleConfirm}
>
<Text style={editModalStyles.saveBtnText}>Confirm Borrow</Text>
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

// State for Detail Modal
const [isDetailModalVisible, setDetailModalVisible] = useState(false);
const [selectedBookForDetail, setSelectedBookForDetail] = useState(null);

// State for Borrow Form Modal
const [isModalVisible, setModalVisible] = useState(false);
const [selectedBook, setSelectedBook] = useState(null);

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
const time = new Date().toLocaleTimeString('en-PH', {
timeZone: 'Asia/Manila',
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

const handleDetailPress = (book) => {
setSelectedBookForDetail(book);
setDetailModalVisible(true);
};

const handleBorrowFromDetail = () => {
setDetailModalVisible(false);
setSelectedBook(selectedBookForDetail);
setModalVisible(true);
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
onDetailPress={() => handleDetailPress({
title: "The Great Gatsby",
author: "F. Scott Fitzgerald",
category: "Classic",
img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
publisher: "Scribner",
desc: "A classic American novel about the Jazz Age.",
remaining: 3,
quantity: 5
})}
/>
<BookCard
title="Clean Code"
author="Robert C. Martin"
category="Technology"
image="https://images.unsplash.com/photo-1515879218367-8466d910aaa4"
isBorrowed={borrowed.includes("Clean Code")}
onDetailPress={() => handleDetailPress({
title: "Clean Code",
author: "Robert C. Martin",
category: "Technology",
img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
publisher: "Prentice Hall",
desc: "A practical guide to writing clean and readable code.",
remaining: 2,
quantity: 4
})}
/>
</ScrollView>
</ScrollView>

<BorrowFormModal
visible={isModalVisible}
onClose={() => setModalVisible(false)}
bookDetails={selectedBook}
onConfirm={(formData) => {
// Handle borrow confirmation for HomeScreen
console.log("Borrow from home:", formData);
}}
/>

<BookDetailModal
visible={isDetailModalVisible}
onClose={() => setDetailModalVisible(false)}
bookDetails={selectedBookForDetail}
onBorrow={handleBorrowFromDetail}
/>

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

function BookCard({ title, author, category, image, isBorrowed, onDetailPress }) {
return (
<TouchableOpacity
style={styles.bookCard}
onPress={onDetailPress}
activeOpacity={0.8}
>
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
</TouchableOpacity>
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

function NotificationCard({ type, title, message, time }) {
const getIconProps = () => {
switch (type) {
case "warning":
return { name: "alert-circle", color: "#d32f2f" };
case "info":
return { name: "information-circle", color: "#f57c00" };
case "success":
default:
return { name: "checkmark-circle", color: "#00A86B" };
}
};

const iconProps = getIconProps();

return (
<View style={notif.card}>
<Ionicons name={iconProps.name} size={22} color={iconProps.color} />
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
const [isDetailModalVisible, setDetailModalVisible] = useState(false);
const [selectedBookForDetail, setSelectedBookForDetail] = useState(null);
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

const handleDetailPress = (book) => {
setSelectedBookForDetail(book);
setDetailModalVisible(true);
};

const handleBorrowFromDetail = () => {
setDetailModalVisible(false);
setSelectedBook(selectedBookForDetail);
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

const formatDateForDB = (inputDate) => {
const [month, day, year] = inputDate.split("/");
return new Date(
`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00+08:00`
).toISOString();
};
const formattedDate = formatDateForDB(date);

const {
data: { user },
error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
Alert.alert("Error", "You must be logged in.");
return;
}

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

const time = new Date().toLocaleTimeString('en-PH', {
timeZone: 'Asia/Manila',
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
<TouchableOpacity
key={i}
style={catalogCard}
onPress={() => handleDetailPress(b)}
activeOpacity={0.7}
>
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
</TouchableOpacity>
);
})}
</ScrollView>

<BorrowFormModal
visible={isModalVisible}
onClose={() => setModalVisible(false)}
bookDetails={selectedBook}
onConfirm={handleConfirmBorrow}
/>

<BookDetailModal
visible={isDetailModalVisible}
onClose={() => setDetailModalVisible(false)}
bookDetails={selectedBookForDetail}
onBorrow={handleBorrowFromDetail}
/>
</SafeAreaView>
);
}

/* ================= LibraryPLACEHOLDERS================= */
function LibraryScreen() {
const { borrowed, setBorrowed, setNotifications } = useContext(LibraryContext);
const [books, setBooks] = useState([]);
const [isDetailModalVisible, setDetailModalVisible] = useState(false);
const [selectedBookForDetail, setSelectedBookForDetail] = useState(null);
const [isModalVisible, setModalVisible] = useState(false);
const [selectedBook, setSelectedBook] = useState(null);

useEffect(() => {
fetchBooks();
}, []);

const fetchBooks = async () => {
const { data, error } = await supabase.from("books").select("*");
if (error) {
console.log("Error fetching books:", error);
} else {
const formatted = data.map(book => ({
id: book.id,
category: book.category,
title: book.title,
author: book.author,
publisher: book.publisher,
desc: book.description,
img: book.image,
remaining: book.remaining,
quantity: book.quantity

}));
setBooks(formatted);
}
};

const handleDetailPress = (book) => {
setSelectedBookForDetail(book);
setDetailModalVisible(true);
};

const handleBorrowFromDetail = () => {
setDetailModalVisible(false);
setSelectedBook(selectedBookForDetail);
setModalVisible(true);
};

const handleBorrowPress = (book) => {
setSelectedBook(book);
setModalVisible(true);
};

const handleConfirmBorrow = async (formData) => {
try {
const { fullName, section, date, quantity } = formData;
const formatDateForDB = (inputDate) => {
const [month, day, year] = inputDate.split("/");
return new Date(
`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00+08:00`
).toISOString();
};
const formattedDate = formatDateForDB(date);
const {
data: { user },
error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
Alert.alert("Error", "You must be logged in.");
return;
}
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

const time = new Date().toLocaleTimeString('en-PH', {
timeZone: 'Asia/Manila',
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
<SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FF", padding: 16 }}>
<ScrollView>
<Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12, marginTop:25 }}>
List of Books
</Text>

{books.length === 0 ? (
<Text style={{ color: "#777", marginTop: 20 }}>No books available</Text>
) : (
books.map((book) => (
<TouchableOpacity
key={book.id}
onPress={() => handleDetailPress(book)}
activeOpacity={0.7}
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
source={{ uri: book.img }}
style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: "#ddd" }}
/>
<View style={{ flex: 1, marginLeft: 12 }}>
<Text style={{ fontWeight: "700" }}>{book.title}</Text>
<Text style={{ color: "#555", fontSize: 12 }}>{book.author}</Text>
<Text style={{ color: "#5B5FFF", fontSize: 12 }}>{book.category}</Text>
<Text style={{ color: "#777", fontSize: 12 }}>{book.desc}</Text>
</View>
</TouchableOpacity>
))
)}
</ScrollView>

<BorrowFormModal
visible={isModalVisible}
onClose={() => setModalVisible(false)}
bookDetails={selectedBook}
onConfirm={handleConfirmBorrow}
/>

<BookDetailModal
visible={isDetailModalVisible}
onClose={() => setDetailModalVisible(false)}
bookDetails={selectedBookForDetail}
onBorrow={handleBorrowFromDetail}
/>
</SafeAreaView>
);
}

/* ================= wwwDashboard================= */
function DashboardScreen() {
const { borrowed, setBorrowed, setNotifications } = useContext(LibraryContext);
const [loading, setLoading] = useState(true);
const [isEditModalVisible, setEditModalVisible] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

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

const handleUpdateRecord = async (updatedData) => {
  try {
    const { error } = await supabase
      .from("borrow_books")
      .update({
        full_name: updatedData.full_name,
        section: updatedData.section,
        quantity: updatedData.quantity,
      })
      .eq("id", updatedData.id);

    if (error) {
      Alert.alert("Error", "Failed to update record.");
      return;
    }

    setEditModalVisible(false);
    fetchBorrowedBooks();
    Alert.alert("Success", "Record updated successfully!");
  } catch (err) {
    console.log(err);
  }
};

const handleReturn = async (item) => {
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
const time = new Date().toLocaleTimeString('en-PH', {
timeZone: 'Asia/Manila',
hour: "2-digit",
minute: "2-digit",
});

setNotifications((prev) => [
{
type: "success",
title: "Book Returned",
message: `"${item.title}" has been successfully returned`,
time,
},
...prev,
]);

fetchBorrowedBooks();
Alert.alert("Success", "Book returned!");
};

const handleDelete = async (item) => {
const { error } = await supabase
.from("borrow_books")
.delete()
.eq("id", item.id);

if (!error) {
const time = new Date().toLocaleTimeString('en-PH', {
timeZone: 'Asia/Manila',
hour: "2-digit",
minute: "2-digit",
});

setNotifications((prev) => [
{
type: "info",
title: "Record Deleted",
message: `Record for "${item.title}" has been removed`,
time,
},
...prev,
]);

fetchBorrowedBooks();
Alert.alert("Deleted", "Record removed");
}
};
const formatDate = (dateString) => {
if (!dateString) return "N/A";
const date = new Date(dateString);
return date.toLocaleDateString('en-US', {
timeZone: 'Asia/Manila',
month: 'short',
day: 'numeric',
year: 'numeric',
});
};
const calculateDueDate = (borrowDate) => {
if (!borrowDate) return "N/A";
const date = new Date(borrowDate);
date.setDate(date.getDate() + 14);
return date.toLocaleDateString('en-US', {
timeZone: 'Asia/Manila',
month: 'short',
day: 'numeric',
year: 'numeric',
});
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

{/* HEADER: BOOK TITLE */}
<Text style={dash.bookTitleMain}>{item.title}</Text>

{/* ROW 1: AUTHOR */}
<View style={dash.infoRow}>
<Text style={dash.infoLabel}>Author:</Text>
<Text style={dash.infoValue}>{item.author}</Text>
</View>

{/* ROW 1.5: PUBLISHER */}
<View style={dash.infoRow}>
<Text style={dash.infoLabel}>Publisher:</Text>
<Text style={dash.infoValue}>{item.publisher}</Text>
</View>

{/* ROW 2: BORROWER & SECTION */}
<View style={dash.twoColumnRow}>
<View style={dash.column}>
<Text style={dash.infoLabel}>Borrower:</Text>
<Text style={dash.infoValue}>{item.full_name}</Text>
</View>
<View style={dash.column}>
<Text style={dash.infoLabel}>Grade & Section:</Text>
<Text style={dash.infoValue}>{item.section}</Text>
</View>
</View>

{/* ROW 3: QUANTITY */}
<View style={dash.infoRow}>
<Text style={dash.infoLabel}>Quantity:</Text>
<Text style={dash.infoValue}>{item.quantity}</Text>
</View>

{/* ROW 4: DATES */}
<View style={dash.twoColumnRow}>
<View style={dash.column}>
<Text style={dash.infoLabel}>Borrow Date:</Text>
<Text style={dash.infoValue}>{formatDate(item.date_borrowed)}</Text>
</View>
<View style={dash.column}>
<Text style={dash.infoLabel}>Due Date:</Text>
<Text style={[dash.infoValue, dash.dueDate]}>{calculateDueDate(item.date_borrowed)}</Text>
</View>
</View>

{/* BUTTONS */}
<View style={dash.buttonRow}>
<TouchableOpacity
style={dash.returnBtn}
onPress={() => handleReturn(item)}
>
<Ionicons name="checkmark" size={16} color="#fff" />
<Text style={dash.btnText}>Return</Text>
</TouchableOpacity>
<TouchableOpacity
style={dash.editBtn}
onPress={() => {
  setSelectedItem(item);
  setEditModalVisible(true);
}}
>
<Ionicons name="pencil" size={14} color="#333" />
<Text style={[dash.btnText, { color: '#333' }]}>Edit</Text>
</TouchableOpacity>

<TouchableOpacity
style={dash.deleteBtn}
onPress={() => handleDelete(item)}
>
<Ionicons name="trash" size={16} color="#fff" />
<Text style={dash.btnText}>Delete</Text>
</TouchableOpacity>

<TouchableOpacity
style={dash.dueDateReminderBtn}
onPress={() => {
const time = new Date().toLocaleTimeString('en-PH', {
timeZone: 'Asia/Manila',
hour: "2-digit",
minute: "2-digit",
});
setNotifications((prev) => [
{
type: "warning",
title: "Due Date Reminder",
message: `"${item.title}" is due on ${calculateDueDate(item.date_borrowed)}`,
time,
},
...prev,
]);
Alert.alert("Reminder", `Due Date: ${calculateDueDate(item.date_borrowed)}`);
}}
>
<Ionicons name="time" size={16} color="#fff" />
<Text style={dash.btnText}>Due Date</Text>
</TouchableOpacity>
</View>
</View>
))
)}
</ScrollView>

<EditBorrowModal
  visible={isEditModalVisible}
  onClose={() => setEditModalVisible(false)}
  item={selectedItem}
  onSave={handleUpdateRecord}
/>

</SafeAreaView>
);
}
const dash = StyleSheet.create({
title: {
fontSize: 24,
fontWeight: "800",
marginTop: 16,
marginBottom: 20,
color: "#1a1a2e",
},
card: {
backgroundColor: "#fff",
borderRadius: 14,
padding: 18,
marginBottom: 14,
shadowColor: "#000",
shadowOffset: { width: 0, height: 3 },
shadowOpacity: 0.12,
shadowRadius: 8,
elevation: 4,
borderTopWidth: 4,
borderTopColor: "#5B5FFF",
},
bookTitleMain: {
fontSize: 18,
fontWeight: "800",
color: "#1a1a2e",
marginBottom: 16,
paddingBottom: 12,
borderBottomWidth: 1,
borderBottomColor: "#f0f2f5",
},
infoRow: {
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
marginBottom: 14,
paddingVertical: 10,
borderBottomWidth: 1,
borderBottomColor: "#f5f7fb",
},
twoColumnRow: {
flexDirection: "row",
justifyContent: "space-between",
marginBottom: 14,
gap: 12,
},
column: {
flex: 1,
paddingVertical: 10,
paddingHorizontal: 10,
backgroundColor: "#f8f9fb",
borderRadius: 10,
},
infoLabel: {
fontSize: 12,
fontWeight: "700",
color: "#888",
marginBottom: 6,
textTransform: "uppercase",
letterSpacing: 0.5,
},
infoValue: {
fontSize: 14,
fontWeight: "600",
color: "#1a1a2e",
},
dueDate: {
color: "#d32f2f",
fontWeight: "700",
},
buttonRow: {
flexDirection: "row",
gap: 8,
marginTop: 16,
},
returnBtn: {
flex: 1,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
backgroundColor: "#4CAF50",
paddingVertical: 9,
paddingHorizontal: 10,
borderRadius: 8,
shadowColor: "#4CAF50",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.2,
shadowRadius: 4,
elevation: 3,
},
editBtn: {
flex: 1,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
backgroundColor: "#f5f5f5",
paddingVertical: 9,
paddingHorizontal: 8,
borderRadius: 8,
borderWidth: 1,
borderColor: "#ddd",
},
deleteBtn: {
flex: 1,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
backgroundColor: "#f44336",
paddingVertical: 9,
paddingHorizontal: 10,
borderRadius: 8,
shadowColor: "#f44336",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.2,
shadowRadius: 4,
elevation: 3,
},
dueDateReminderBtn: {
flex: 1,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
backgroundColor: "#e84c3d",
paddingVertical: 9,
paddingHorizontal: 10,
borderRadius: 8,
shadowColor: "#e84c3d",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.2,
shadowRadius: 4,
elevation: 3,
},
btnText: {
color: "#fff",
fontWeight: "700",
marginLeft: 6,
fontSize: 11,
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
backgroundColor: "#F9F8F3",
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
color: "#1a1a2e"
},
inputGroup: {
marginBottom: 12,
},
label: {
fontSize: 14,
fontWeight: "600",
color: "#333",
marginBottom: 5,
},
input: {
height: 45,
borderWidth: 1,
borderColor: "#e0e0e0",
borderRadius: 8,
paddingHorizontal: 10,
backgroundColor: "#fff",
color: "#333"
},
dateContainer: {
flexDirection: 'row',
alignItems: 'center',
height: 45,
borderWidth: 1,
borderColor: '#e0e0e0',
borderRadius: 8,
backgroundColor: "#fff",
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
quantityControlContainer: {
flexDirection: "row",
alignItems: "center",
justifyContent: "space-between",
height: 45,
backgroundColor: "#F9F8F3",
borderRadius: 8,
borderWidth: 1,
borderColor: "#ddd",
paddingHorizontal: 10,
marginTop: 4,
},
qtyValueText: {
fontSize: 15,
color: "#333",
fontWeight: "500",
},
qtyArrowsContainer: {
backgroundColor: "#fff",
borderRadius: 6,
padding: 2,
borderWidth: 1,
borderColor: "#F0EFEA",
},
qtyArrowBtn: {
paddingHorizontal: 4,
paddingVertical: 1,
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

/* ========= BOOK DETAIL MODAL STYLES ========= */
const editModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#F9F8F3', 
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 450,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    fontFamily: 'serif', 
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
  },
  inputActive: {
    borderColor: '#1a4331', 
    borderWidth: 2,
  },
  dateRow: {
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1a4331', 
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

const bookDetailStyles = StyleSheet.create({
overlay: {
flex: 1,
backgroundColor: 'rgba(0, 0, 0, 0.5)',
justifyContent: 'center',
alignItems: 'center',
},
container: {
backgroundColor: '#fff',
borderRadius: 20,
paddingHorizontal: 16,
paddingTop: 12,
paddingBottom: 16,
width: '85%',
maxHeight: '80%',
},
header: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 12,
},
headerPlaceholder: {
width: 24,
},
bookImage: {
width: '100%',
height: 200,
borderRadius: 12,
marginBottom: 16,
backgroundColor: '#ddd',
},
content: {
marginBottom: 12,
},
title: {
fontSize: 18,
fontWeight: '700',
color: '#333',
marginBottom: 12,
},
metaRow: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 10,
},
metaText: {
fontSize: 13,
color: '#555',
marginLeft: 8,
fontWeight: '500',
},
availabilityContainer: {
backgroundColor: '#f5f5f5',
borderRadius: 10,
padding: 10,
marginVertical: 12,
},
availabilityBadge: {
backgroundColor: '#4CAF50',
borderRadius: 16,
paddingHorizontal: 10,
paddingVertical: 3,
alignSelf: 'flex-start',
marginBottom: 6,
},
badgeText: {
color: '#fff',
fontWeight: '600',
fontSize: 11,
},
copiesText: {
color: '#555',
fontSize: 12,
fontWeight: '500',
},
description: {
fontSize: 12,
color: '#666',
lineHeight: 18,
marginTop: 10,
},
buttonContainer: {
flexDirection: 'row',
gap: 10,
marginTop: 12,
},
closeBtn: {
flex: 1,
paddingVertical: 12,
paddingHorizontal: 20,
borderRadius: 10,
backgroundColor: '#fff',
borderWidth: 1.5,
borderColor: '#ddd',
justifyContent: 'center',
alignItems: 'center',
},
closeBtnText: {
color: '#333',
fontSize: 14,
fontWeight: '600',
},
borrowButton: {
flex: 2,
backgroundColor: '#1a4331', 
borderRadius: 10,
paddingVertical: 12,
justifyContent: 'center',
alignItems: 'center',
},
borrowButtonDisabled: {
backgroundColor: '#ccc',
},
borrowButtonText: {
color: '#fff',
fontSize: 14,
fontWeight: '600',
},
});