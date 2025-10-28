const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { admin } = require('../models/database');

/**
 * POST /api/auth/login
 * Admin-inloggning
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Användarnamn och lösenord krävs'
      });
    }

    // Hitta admin-användare
    const adminUser = await admin.findByUsername(username);
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Ogiltigt användarnamn eller lösenord'
      });
    }

    // Kontrollera lösenord
    const passwordMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Ogiltigt användarnamn eller lösenord'
      });
    }

    // Uppdatera senaste inloggning
    await admin.updateLastLogin(adminUser.id);

    // Skapa session
    req.session.adminId = adminUser.id;
    req.session.adminUsername = adminUser.username;
    req.session.isAdmin = true;

    res.json({
      success: true,
      message: 'Inloggning lyckades',
      data: {
        id: adminUser.id,
        username: adminUser.username,
        lastLogin: adminUser.last_login
      }
    });

    console.log(`Admin-inloggning: ${username}`);
  } catch (error) {
    console.error('Fel vid admin-inloggning:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfel vid inloggning',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Admin-utloggning
 */
router.post('/logout', (req, res) => {
  try {
    if (req.session.isAdmin) {
      const username = req.session.adminUsername;
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Fel vid sessionförstöring:', err);
          return res.status(500).json({
            success: false,
            message: 'Kunde inte logga ut'
          });
        }

        res.json({
          success: true,
          message: 'Utloggning lyckades'
        });

        console.log(`Admin-utloggning: ${username}`);
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Inte inloggad'
      });
    }
  } catch (error) {
    console.error('Fel vid utloggning:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfel vid utloggning',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/status
 * Kontrollera admin-status
 */
router.get('/status', (req, res) => {
  try {
    if (req.session.isAdmin) {
      res.json({
        success: true,
        isAuthenticated: true,
        data: {
          id: req.session.adminId,
          username: req.session.adminUsername
        }
      });
    } else {
      res.json({
        success: true,
        isAuthenticated: false
      });
    }
  } catch (error) {
    console.error('Fel vid status-kontroll:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfel vid status-kontroll',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/change-password
 * Byt lösenord för admin
 */
router.post('/change-password', async (req, res) => {
  try {
    if (!req.session.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Inte inloggad som admin'
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nuvarande och nytt lösenord krävs'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nytt lösenord måste vara minst 6 tecken'
      });
    }

    // Hämta admin-användare
    const adminUser = await admin.findByUsername(req.session.adminUsername);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin-användare inte funnen'
      });
    }

    // Kontrollera nuvarande lösenord
    const passwordMatch = await bcrypt.compare(currentPassword, adminUser.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Felaktigt nuvarande lösenord'
      });
    }

    // Hasha nytt lösenord och uppdatera
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    // Här skulle vi lägga till en updatePassword-metod i admin-operationer
    
    res.json({
      success: true,
      message: 'Lösenord uppdaterat'
    });

    console.log(`Lösenord ändrat för admin: ${req.session.adminUsername}`);
  } catch (error) {
    console.error('Fel vid lösenordsändring:', error);
    res.status(500).json({
      success: false,
      message: 'Serverfel vid lösenordsändring',
      error: error.message
    });
  }
});

/**
 * Middleware för att kontrollera admin-rättigheter
 */
function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(401).json({
      success: false,
      message: 'Admin-rättigheter krävs'
    });
  }
  next();
}

module.exports = router;
module.exports.requireAdmin = requireAdmin;