// --- 1. FIREBASE CONFIGURATION ---
// PASTE YOUR KEYS INSIDE THIS OBJECT BELOW
  const firebaseConfig = {
    apiKey: "AIzaSyDD91o8AUil66cKPFJ3h24oNkWh6iYJC0c",
    authDomain: "datanext-c865c.firebaseapp.com",
    projectId: "datanext-c865c",
    storageBucket: "datanext-c865c.firebasestorage.app",
    messagingSenderId: "640734514110",
    appId: "1:640734514110:web:f1d80d4ba79b789da9c7ef",
    measurementId: "G-H110T2PPDT"
  };
// --- INITIALIZATION CHECK ---
// This checks if you actually replaced the placeholder text above
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app, auth, db;

if (isConfigured) {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Connect to database
    auth.signInAnonymously()
        .then(() => console.log("Connected to Database"))
        .catch((error) => console.error("Auth Error:", error));

    // Initialize Listeners
    setupRealtimeListeners();
} else {
    console.error("FIREBASE NOT CONFIGURED: Please open script.js and add your API keys.");
}

// --- CONSTANTS ---
const COLLECTION_PREFIX = "datanext_website"; // Simplified for hosting

// --- REAL-TIME LISTENERS ---
function setupRealtimeListeners() {
    // 1. Services
    db.collection(`${COLLECTION_PREFIX}_services`).onSnapshot(snapshot => {
        const container = document.getElementById('services-container');
        if (snapshot.empty) return; 
        
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
            <div class="card">
                <div class="icon-box"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
                <h3>${data.title}</h3>
                <p>${data.description}</p>
            </div>`;
        });
        container.innerHTML = html;
    });

    // 2. Projects
    db.collection(`${COLLECTION_PREFIX}_projects`).onSnapshot(snapshot => {
        const container = document.getElementById('projects-container');
        if (snapshot.empty) return; 

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
            <div class="project-card">
                <div class="project-img"><svg width="40" height="40" stroke="white" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect></svg></div>
                <div class="project-body"><span class="project-tag">${data.category}</span><h3>${data.title}</h3><p>${data.description}</p></div>
            </div>`;
        });
        container.innerHTML = html;
    });

    // 3. Messages (Admin Panel)
    db.collection(`${COLLECTION_PREFIX}_messages`).orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        const container = document.getElementById('messages-container');
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #94a3b8;">No messages received yet.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
            <div class="message-item">
                <div class="message-header"><span><strong>${data.name}</strong> (${data.email})</span><span>${data.service}</span></div>
                <p style="color: white; margin: 0;">${data.message}</p>
            </div>`;
        });
        container.innerHTML = html;
    });
}

// --- FORM HANDLING ---

// 1. Contact Form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    
    if (!isConfigured) {
        alert("ERROR: You have not added your Firebase API Keys to script.js yet!");
        return;
    }

    btn.innerText = "Sending...";
    btn.disabled = true;

    try {
        await db.collection(`${COLLECTION_PREFIX}_messages`).add({
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            service: document.getElementById('contactService').value,
            message: document.getElementById('contactMessage').value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Message Sent Successfully!");
        e.target.reset();
    } catch (err) {
        console.error("Error sending message:", err);
        alert("Error sending message. \n\nCheck if your Database Rules are set to 'allow read, write: if true;' in the Firebase Console.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// 2. Add Service (Admin)
document.getElementById('addServiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isConfigured) { alert("Configure API keys first."); return; }
    
    try {
        await db.collection(`${COLLECTION_PREFIX}_services`).add({
            title: document.getElementById('serviceTitle').value,
            description: document.getElementById('serviceDesc').value,
            created: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Service Uploaded!"); e.target.reset();
    } catch (err) { alert("Upload failed. Check DB Rules."); }
});

// 3. Add Project (Admin)
document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isConfigured) { alert("Configure API keys first."); return; }

    try {
        await db.collection(`${COLLECTION_PREFIX}_projects`).add({
            title: document.getElementById('projectTitle').value,
            category: document.getElementById('projectCategory').value,
            description: document.getElementById('projectDesc').value,
            created: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Project Uploaded!"); e.target.reset();
    } catch (err) { alert("Upload failed. Check DB Rules."); }
});

// Admin Toggle
window.toggleAdmin = function() {
    const panel = document.getElementById('admin-panel');
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
        return;
    }
    const password = prompt("Enter Admin Password:");
    if (password === "admin123") {
        panel.classList.add('active');
        panel.scrollIntoView({behavior: 'smooth'});
    } else if (password !== null) {
        alert("Incorrect Password");
    }
}
