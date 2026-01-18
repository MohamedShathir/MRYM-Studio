import { auth, db, googleProvider } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    onAuthStateChanged,
    updateProfile,
    setPersistence, 
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Force Session Persistence (Fixes "Not Logged In" issues)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Persistence Error:", error);
});

// --- GOOGLE SIGN IN (POPUP MODE) ---
const googleBtn = document.getElementById('google-btn');
if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Change text so you know it's working
        const originalText = googleBtn.innerHTML;
        googleBtn.innerHTML = "Opening Secure Popup...";
        googleBtn.disabled = true;

        try {
            // A. Open the Popup
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            googleBtn.innerHTML = "Verifying Account...";

            // B. Check if User Exists in Database
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                // EXISTING USER -> Go Home
                const redirect = sessionStorage.getItem('redirectAfterLogin') || "index.html";
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirect;
            } else {
                // NEW USER -> Complete Profile
                window.location.href = "complete-profile.html";
            }

        } catch (error) {
            console.error("Google Login Error:", error);
            // Only alert if it's NOT the user simply closing the popup
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Login Failed: " + error.message);
            }
            // Reset button
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
        }
    });
}


// --- EMAIL SIGNUP FORM ---
const emailSignupForm = document.getElementById('email-signup-form');
if (emailSignupForm) {
    emailSignupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const address = document.getElementById('reg-address').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const confirmPass = document.getElementById('reg-pass-confirm').value;

        if (pass !== confirmPass) { alert("Passwords do not match!"); return; }

        const btn = e.target.querySelector('button');
        btn.textContent = "Creating Account...";
        btn.disabled = true;

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            const user = cred.user;

            // Save Data Immediately
            await setDoc(doc(db, "users", user.uid), {
                name: name, email: email, phone: phone, address: address, cart: [], createdAt: new Date()
            });

            await updateProfile(user, { displayName: name });
            alert("Account created! Logging you in...");
            window.location.href = "index.html";

        } catch (error) {
            alert("Signup Error: " + error.message);
            btn.textContent = "Create Account";
            btn.disabled = false;
        }
    });
}


// --- LOGIN FORM ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button');
        btn.textContent = "Logging in...";
        
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
            // Auth State Change in other files handles the UI, but we force redirect here for safety
            const redirect = sessionStorage.getItem('redirectAfterLogin') || "index.html";
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirect;
        } catch(err) { 
            alert("Login Failed: " + err.message); 
            btn.textContent = "Log In";
        }
    });
}