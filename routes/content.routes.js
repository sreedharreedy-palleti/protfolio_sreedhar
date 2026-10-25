const express = require('express');
const router = express.Router();
const PortfolioContent = require('../models/PortfolioContent');
const About = require('../models/About');
const { verifyAdmin } = require('../middleware/auth.middleware');

// GET content (Public)
router.get('/', async (req, res) => {
  try {
    let content = await PortfolioContent.findOne();
    if (!content) {
      content = await PortfolioContent.create({
        skills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Python', 'Tailwind CSS', 'Docker'],
      });
    }
    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolio content.' });
  }
});

// UPDATE content (Admin Only)
router.put('/', verifyAdmin, async (req, res) => {
  try {
    let content = await PortfolioContent.findOne();
    if (!content) {
      content = new PortfolioContent(req.body);
    } else {
      if (req.body.hero) {
        content.hero = {
          badge: req.body.hero.badge ?? content.hero?.badge ?? 'Full-Stack Developer',
          heading: req.body.hero.heading ?? content.hero?.heading ?? "HELLO ! I'm Venkata Sreedhar Reddy Palleti",
          subheading: req.body.hero.subheading ?? content.hero?.subheading ?? 'Specializing in React, Node.js, Express, MongoDB, and modern cloud ecosystems with clean architectural patterns.',
          avatarUrl: req.body.hero.avatarUrl !== undefined ? req.body.hero.avatarUrl : (content.hero?.avatarUrl || ''),
          statusPill: req.body.hero.statusPill !== undefined ? req.body.hero.statusPill : (content.hero?.statusPill || 'Full-Stack Engineering'),
          chips: Array.isArray(req.body.hero.chips) ? req.body.hero.chips : (content.hero?.chips || []),
        };
      }
      if (req.body.about) {
        content.about = { ...(content.about?.toObject ? content.about.toObject() : content.about), ...req.body.about };
        // Sync to standalone About document
        try {
          let aboutDoc = await About.findOne();
          if (aboutDoc) {
            Object.assign(aboutDoc, req.body.about);
            await aboutDoc.save();
          } else {
            await About.create(req.body.about);
          }
        } catch (e) {
          console.warn('Sync to About collection warning:', e.message);
        }
      }
      if (req.body.skills) {
        content.skills = req.body.skills;
      }
      if (req.body.contactInfo) {
        content.contactInfo = { ...(content.contactInfo?.toObject ? content.contactInfo.toObject() : content.contactInfo), ...req.body.contactInfo };
      }
      if (req.body.education) {
        content.education = req.body.education;
      }
    }
    const updated = await content.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update portfolio content.' });
  }
});

module.exports = router;
