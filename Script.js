// --- 1. HOSTING INSTRUCTIONS: REPLACING CONFIG ---
let firebaseConfig = null; 

/* EXAMPLE (Uncomment and fill this in when hosting):
firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "...",
    appId: "..."
};
*/

// --- 2. PREVIEW LOGIC (DO NOT EDIT) ---
let appId = 'default-app';
if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app';
}

// --- GLOBAL VARIABLES ---
let db = null; // Will hold the database connection if configured

// --- INITIALIZATION ---
if (firebaseConfig) {
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    db = firebase.firestore();
    
    // Connect and then Seed Database if empty
    auth.signInAnonymously()
        .then(() => {
            console.log("Connected to Database.");
            seedDatabase(); // <--- NEW: Automatically populates DB with your resume data
        })
        .catch((error) => console.error("Auth Error:", error));
    
    // Setup Real-time Listeners
    setupRealtimeListeners();
} else {
    console.warn("No Firebase Config found. Running in DEMO MODE.");
    // In demo mode, we use the default hardcoded HTML content.
}

// --- DATA COLLECTION HELPER ---
const getCollection = (name) => `artifacts/${appId}/public/data/${name}`;

// --- NEW: SEED DATABASE FUNCTION ---
// This uploads your resume data to the database automatically if it's empty
async function seedDatabase() {
    const servicesRef = db.collection(getCollection('services'));
    const projectsRef = db.collection(getCollection('projects'));

    // 1. Seed Services
    const servicesSnap = await servicesRef.get();
    if (servicesSnap.empty) {
        console.log("Seeding Services...");
        const services = [
             { title: "Data Analysis", description: "Python (Pandas, NumPy), SQL, and EDA. Turning complex datasets into clear, actionable business strategies." },
             { title: "Visualization & Power BI", description: "Creating comprehensive dashboards and visual stories to track KPIs (Revenue, Profit, Growth)." },
             { title: "Automated Reporting", description: "Excel Power Query and Pivot Tables to reduce reporting time by 40% and eliminate manual errors." }
        ];
        services.forEach(s => servicesRef.add({...s, created: firebase.firestore.FieldValue.serverTimestamp()}));
    }

    // 2. Seed Projects
    const projectsSnap = await projectsRef.get();
    if (projectsSnap.empty) {
         console.log("Seeding Projects...");
         const projects = [
            { title: "Sales Forecasting", category: "Python & SQL", description: "Developed forecasting models (ARIMA & XGBoost) improving prediction accuracy by 18-25%." },
            { title: "E-commerce Dashboard", category: "Power BI", description: "Automated KPI tracking connected to Excel, identifying key category performance." },
            { title: "Customer Analysis", category: "Segmentation", description: "Identified top 10% high-value customers driving 45% of revenue using SQL." }
         ];
         projects.forEach(p => projectsRef.add({...p, created: firebase.firestore.FieldValue.serverTimestamp()}));
    }
}

// --- REAL-TIME LISTENERS (Only runs if Firebase is connected) ---
function setupRealtimeListeners() {
    // 1. Services
    db.collection(getCollection('services')).onSnapshot(snapshot => {
        const container = document.getElementById('services-container');
        if (snapshot.empty) return; // Keep hardcoded defaults if empty
        
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
    db.collection(getCollection('projects')).onSnapshot(snapshot => {
        const container = document.getElementById('projects-container');
        if (snapshot.empty) return; // Keep hardcoded defaults if empty

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
    db.collection(getCollection('messages')).onSnapshot(snapshot => {
        const container = document.getElementById('messages-container');
        const messages = [];
        snapshot.forEach(doc => messages.push(doc.data()));
        
        // Sort by timestamp descending
        messages.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        if (messages.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8;">No messages received yet.</p>';
            return;
        }

        let html = '';
        messages.forEach(data => {
            html += `
            <div class="message-item">
                <div class="message-header"><span><strong>${data.name}</strong> (${data.email})</span><span>${data.service}</span></div>
                <p style="color: white; margin: 0;">${data.message}</p>
            </div>`;
        });
        container.innerHTML = html;
    });
}

// --- FORM HANDLING (Works in both Real and Demo modes) ---

// 1. Contact Form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // STOP PAGE RELOAD
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Sending...";
    btn.disabled = true;

    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        service: document.getElementById('contactService').value,
        message: document.getElementById('contactMessage').value,
        timestamp: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
    };

    try {
        if (db) {
            // Real Mode: Save to Database
            await db.collection(getCollection('messages')).add(formData);
            alert("Message Sent! We will contact you soon.");
        } else {
            // Demo Mode: Simulate Success
            await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
            console.log("Demo Message:", formData);
            alert("Message Sent! We will contact you soon.)");
        }
        e.target.reset();
    } catch (err) {
        console.error(err);
        alert("Error sending message.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// 2. Add Service Form (Admin)
document.getElementById('addServiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!db) { alert("Please configure Firebase keys in script.js to save data permanently."); return; }
    
    try {
        await db.collection(getCollection('services')).add({
            title: document.getElementById('serviceTitle').value,
            description: document.getElementById('serviceDesc').value,
            created: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Service Uploaded!"); e.target.reset();
    } catch (err) { alert("Upload failed"); }
});

// 3. Add Project Form (Admin)
document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!db) { alert("Please configure Firebase keys in script.js to save data permanently."); return; }

    try {
        await db.collection(getCollection('projects')).add({
            title: document.getElementById('projectTitle').value,
            category: document.getElementById('projectCategory').value,
            description: document.getElementById('projectDesc').value,
            created: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Project Uploaded!"); e.target.reset();
    } catch (err) { alert("Upload failed"); }
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