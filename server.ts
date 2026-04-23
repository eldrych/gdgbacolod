import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Papa from 'papaparse';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase Admin
const adminApp = admin.initializeApp({
  projectId: firebaseConfig.projectId,
});
const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Firestore Sync Helpers
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
  } catch (e) {
    console.error('Failed to load config from Firestore:', e);
  }
}

async function saveConfigToFirestore(config: Partial<AppConfig>) {
  try {
    await db.doc('metadata/config').set(config, { merge: true });
    appConfig = { ...appConfig, ...config };
  } catch (e) {
    console.error('Failed to save config to Firestore:', e);
  }
}

async function fetchAndSync() {
  if (!appConfig.sheetId) return;

  console.log(`[Cloud-Sync] Fetching registry from Sheet: ${appConfig.sheetId}`);
  try {
    const url = `https://docs.google.com/spreadsheets/d/${appConfig.sheetId}/export?format=csv`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
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

          // Batch write to Firestore
          const batch = db.batch();
          
          // Note: In a real high-scale app, we'd handle batch limits (500)
          // For GDG Bacolod, we assume < 500 or handle reasonably.
          // Let's implement a safe chunked batch write.
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
          
          console.log(`[Cloud-Sync] Synchronization successful. Records: ${guests.length}`);
        }
      }
    });
  } catch (error) {
    console.error('[Cloud-Sync] Error during background synchronization:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/admin/status', (req, res) => {
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
    }
    
    await fetchAndSync();
    res.json({ success: true, count: appConfig.count, lastSync: appConfig.lastSync });
  });

  app.post('/api/webhook/sync', async (req, res) => {
    console.log('[Webhook] Instant sync triggered');
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
      console.error('Firestore check failed:', e);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    
    // Initial Cloud Load
    await loadConfigFromFirestore();
    
    // Initial sync from sheets
    fetchAndSync();
    
    // Background sync every 15 minutes
    setInterval(fetchAndSync, 15 * 60 * 1000);
  });
}

startServer();
