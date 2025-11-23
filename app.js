const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();

const { conn, sql } = require('./connect');
const statsModel = require('./models/stats');
 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 }
}));

app.use(bodyParser.urlencoded({ extended: true }));

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}
app.use((req, res, next) => { res.locals.user = req.session.user || null; next(); });

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Đăng nhập' });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body; // username or email
    const pool = await conn;
    const rs = await pool.request()
      .input('u', sql.VarChar(200), username)
      .query('SELECT TOP 1 * FROM Users WHERE Username = @u OR Email = @u');
    if (rs.recordset.length === 0) {
      return res.render('auth/login', { title: 'Đăng nhập', error: 'Sai tài khoản hoặc mật khẩu' });
    }
    const user = rs.recordset[0];
    if (user.Password !== password) {
      return res.render('auth/login', { title: 'Đăng nhập', error: 'Sai tài khoản hoặc mật khẩu' });
    }
    req.session.user = { id: user.Id, username: user.Username, fullname: user.FullName, role: user.Role };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Login error');
  }
});

app.get('/logout', (req, res) => { req.session.destroy(() => res.redirect('/login')); });

app.get('/dashboard', ensureAuth, async (req, res) => {
  res.render('dashboard/index', { title: 'Bảng điều khiển' });
});

// API: số liệu mới nhất
app.get('/api/stats/latest', ensureAuth, async (req, res) => {
  try {
    const latest = await statsModel.getLatest();
    res.json(latest || {});
  } catch (err) {
    console.error('Lỗi /api/stats/latest:', err);
    res.status(500).json({ error: 'Failed to fetch latest' });
  }
});

// API: series trong N giờ gần nhất
app.get('/api/stats/series', ensureAuth, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours || '24', 10);
    const series = await statsModel.getSeries(hours);
    res.json(series);
  } catch (err) {
    console.error('Lỗi /api/stats/series:', err);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// API: lịch sử 100 lần đo gần nhất
app.get('/api/stats/history', ensureAuth, async (req, res) => {
  try {
    const pool = await conn;
    const rs = await pool.request().query(`
      SELECT TOP 100
        Id,
        At,
        Temperature,
        Dust,
        Pressure,
        -- dd/MM/yyyy HH:mm cho bảng Lịch sử
        CONVERT(VARCHAR(10), At, 103) + ' ' + CONVERT(VARCHAR(5), At, 108) AS TimeVN
      FROM SensorStats
      ORDER BY At DESC;
    `);
    res.json(rs.recordset);
  } catch (err) {
    console.error('Lỗi /api/stats/history:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});


app.use((req, res) => res.status(404).render('404', { title: 'Not Found' }));
app.listen(port, () => console.info(`App listening at http://localhost:${port}`));
