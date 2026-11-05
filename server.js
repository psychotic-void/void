const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./void.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, author TEXT, category TEXT, description TEXT, date TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id INTEGER, author TEXT, text TEXT, date TEXT
  )`);
});

// Получить все темы
app.get('/api/threads', (req, res) => {
  db.all(`SELECT * FROM threads ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Создать тему
app.post('/api/threads', (req, res) => {
  const { title, author, category, description, date } = req.body;
  db.run(`INSERT INTO threads (title, author, category, description, date) VALUES (?, ?, ?, ?, ?)`,
    [title, author, category, description, date],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.listen(3001, () => {
  console.log('Сервер запущен на http://localhost:3001');
});