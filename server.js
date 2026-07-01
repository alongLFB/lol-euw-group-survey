require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'database.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper to check if file exists and is valid JSON, returns database entries
function getDatabase() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            initDefaultData();
        }
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error("Failed to read database, resetting with default data", e);
        initDefaultData();
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
}

// Helper to save database entries
function saveDatabase(data) {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize default mock data (Empty by default)
function initDefaultData() {
    saveDatabase([]);
}

// API Routes

// Get anonymized survey responses for public dashboard
app.get('/api/survey', (req, res) => {
    const data = getDatabase();
    // Mask WeChat ID, Game ID, and Email fields for public privacy protection
    const anonymizedData = data.map(entry => ({
        ...entry,
        wechatId: "***",
        gameId: "***",
        email: "***"
    }));
    res.json(anonymizedData);
});

// Get detailed survey responses (Admin only)
app.get('/api/admin/survey', (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    const expectedAdminKey = process.env.ADMIN_KEY || 'alongLFB';
    if (adminKey !== expectedAdminKey) {
        return res.status(401).json({ error: "未授权：无效的管理密钥！" });
    }
    const data = getDatabase();
    res.json(data);
});

// Submit a survey response
app.post('/api/survey', (req, res) => {
    const newEntry = req.body;
    
    // Server-side validation
    if (!newEntry.wechatId || !newEntry.gameId || !newEntry.email) {
        return res.status(400).json({ error: "微信ID、游戏ID和邮箱是必填项！" });
    }
    
    const data = getDatabase();
    
    // Check duplicate WeChat ID, Game ID, or Email
    const duplicateExists = data.some(entry => 
        (entry.wechatId && entry.wechatId.trim().toLowerCase() === newEntry.wechatId.trim().toLowerCase()) ||
        (entry.gameId && entry.gameId.trim().toLowerCase() === newEntry.gameId.trim().toLowerCase()) ||
        (entry.email && entry.email.trim().toLowerCase() === newEntry.email.trim().toLowerCase())
    );
    if (duplicateExists) {
        return res.status(400).json({ error: "该微信ID、游戏ID或邮箱已提交过数据，请勿重复提交！" });
    }
    
    // Add extra metadata
    newEntry.id = Date.now().toString();
    newEntry.timestamp = new Date().toISOString();
    
    data.push(newEntry);
    saveDatabase(data);
    
    res.status(201).json({ message: "提交成功！", data: newEntry });
});

// Clear data (Admin only)
app.post('/api/survey/clear', (req, res) => {
    const adminKey = req.headers['x-admin-key'];
    const expectedAdminKey = process.env.ADMIN_KEY || 'alongLFB';
    if (adminKey !== expectedAdminKey) {
        return res.status(401).json({ error: "未授权：您没有此操作的权限！" });
    }
    initDefaultData();
    res.json({ message: "数据重置成功！", data: getDatabase() });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
