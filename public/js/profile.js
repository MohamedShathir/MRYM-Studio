import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Load User Data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Fill basic info
        document.getElementById('user-name').value = user.displayName || "User";
        document.getElementById('user-email').value = user.email;

        // Fetch Address/Phone from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            if(data.phone) document.getElementById('user-phone').value = data.phone;
            if(data.address) document.getElementById('user-address').value = data.address;
        }
    } else {
        window.location.href = "login.html"; // Redirect if not logged in
    }
});

// 2. Save Changes
const form = document.getElementById('profile-form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.textContent = "Saving...";
        
        try {
            const user = auth.currentUser;
            const phone = document.getElementById('user-phone').value;
            const address = document.getElementById('user-address').value;

            await updateDoc(doc(db, "users", user.uid), {
                phone: phone,
                address: address
            });

            alert("Details saved successfully!");
        } catch (error) {
            alert("Error saving: " + error.message);
        } finally {
            btn.textContent = "Save Changes";
        }
    });
}

// 3. Delete Account
const deleteBtn = document.getElementById('delete-acc-btn');
if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
        const confirmDelete = confirm("Are you sure? This will delete your order history and wishlist permanently.");
        if (!confirmDelete) return;

        try {
            const user = auth.currentUser;
            // Delete User Data from Firestore
            await deleteDoc(doc(db, "users", user.uid));
            // Delete User from Auth
            await deleteUser(user);
            
            alert("Account deleted. We are sorry to see you go.");
            window.location.href = "index.html";
        } catch (error) {
            alert("Error: " + error.message + " (Try logging out and logging in again before deleting)");
        }
    });
}