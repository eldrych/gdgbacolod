import express from 'express';
import Papa from 'papaparse';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Env Vars or Config File
let adminApp: admin.app.App;
if (!admin.apps.length) {
  try {
    // If running on Vercel/Production, use environment variables
    if (process.env.FIREBASE_PROJECT_ID) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
    } else {
      // Fallback for local development using the config file
      const firebaseConfig = JSON.parse(require('../firebase-applet-config.json'));
      adminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  } catch (e) {
    console.error('Firebase Initialization Error:', e);
  }
} else {
  adminApp = admin.app();
}

// We need the database ID from the config for Firestore
let firestoreDatabaseId = process.env.FIREBASE_DATABASE_ID;
if (!firestoreDatabaseId) {
  try {
    const firebaseConfig = JSON.parse(require('../firebase-applet-config.json'));
    firestoreDatabaseId = firebaseConfig.firestoreDatabaseId;
  } catch (e) {}
}

const db = getFirestore(adminApp!, firestoreDatabaseId);

const app = express();
app.use(express.json({ limit: '10mb' }));

interface Guest {
  name: string;
  email: string;
}

interface AppConfig {
  sheetId: string | null;
  lastSync: string | null;
  count: number;
}

let appConfig: AppConfig = { sheetId: null, lastSync: null, count: 0 };

async function loadConfigFromFirestore() {
  try {
    const doc = await db.doc('metadata/config').get();
    if (doc.exists) {
      const data = doc.data() as any;
      appConfig = {
        sheetId: data.sheetId || null,
        lastSync: data.lastSync || null,
        count: data.count || 0
      };
    }
  } catch (e) {}
}

async function saveConfigToFirestore(config: Partial<AppConfig>) {
  await db.doc('metadata/config').set(config, { merge: true });
}

async function fetchAndSync() {
  if (!appConfig.sheetId) return;
  try {
    const url = `https://docs.google.com/spreadsheets/d/${appConfig.sheetId}/export?format=csv`;
    const response = await fetch(url);
    if (!response.ok) return;
    const csvText = await response.text();
    
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.data && Array.isArray(results.data)) {
          const guests: Guest[] = results.data.map((item: any) => ({
            name: String(item.name || item.Name || '').trim(),
            email: String(item.email || item.Email || '').trim().toLowerCase()
          })).filter(item => item.name && item.email);

          const CHUNK_SIZE = 400;
          for (let i = 0; i < guests.length; i += CHUNK_SIZE) {
            const chunk = guests.slice(i, i + CHUNK_SIZE);
            const subBatch = db.batch();
            chunk.forEach(guest => {
              const docRef = db.collection('guests').doc(guest.email);
              subBatch.set(docRef, guest);
            });
            await subBatch.commit();
          }

          const syncTime = new Date().toISOString();
          await saveConfigToFirestore({
            lastSync: syncTime,
            count: guests.length
          });
        }
      }
    });
  } catch (error) {}
}

// API Routes
app.get('/api/admin/status', async (req, res) => {
  await loadConfigFromFirestore();
  res.json({ 
    count: appConfig.count, 
    sheetId: appConfig.sheetId,
    lastSync: appConfig.lastSync
  });
});

app.post('/api/admin/sync', async (req, res) => {
  const { sheetId } = req.body;
  if (sheetId) {
    await saveConfigToFirestore({ sheetId });
    appConfig.sheetId = sheetId;
  }
  await fetchAndSync();
  await loadConfigFromFirestore();
  res.json({ success: true, count: appConfig.count, lastSync: appConfig.lastSync });
});

app.post('/api/webhook/sync', async (req, res) => {
  await loadConfigFromFirestore();
  await fetchAndSync();
  res.json({ success: true, message: 'Sync triggered' });
});

app.get('/api/guest/check', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  try {
    const doc = await db.collection('guests').doc(email).get();
    if (doc.exists) {
      const guest = doc.data() as Guest;
      res.json({ found: true, name: guest.name });
    } else {
      res.json({ found: false });
    }
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default app;
