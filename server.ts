import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Guest {
  name: string;
  email: string;
}

// In-memory "database"
let guestList: Guest[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post('/api/admin/import', (req, res) => {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array of guests.' });
    }
    
    // Simple validation and normalize
    guestList = data.map((item: any) => ({
      name: String(item.name || item.Name || '').trim(),
      email: String(item.email || item.Email || '').trim().toLowerCase()
    })).filter(item => item.name && item.email);

    res.json({ success: true, count: guestList.length });
  });

  app.get('/api/guest/check', (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    
    const guest = guestList.find(g => g.email === email);
    
    if (guest) {
      res.json({ found: true, name: guest.name });
    } else {
      res.json({ found: false });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
