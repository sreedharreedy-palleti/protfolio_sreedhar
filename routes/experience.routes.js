const express = require('express');
const router = express.Router();
const Experience = require('../models/Experience');
const { verifyAdmin } = require('../middleware/auth.middleware');

// GET all experiences (auto-seeds if database is empty)
router.get('/', async (req, res) => {
  try {
    let experiences = await Experience.find().sort({ order: 1, createdAt: -1 });

    if (!experiences || experiences.length === 0) {
      try {
        const initialData = require('../data/experiences.data');
        if (Array.isArray(initialData) && initialData.length > 0) {
          const seeded = await Experience.insertMany(initialData);
          experiences = seeded;
        }
      } catch (seedError) {
        console.warn('Initial experience seeding notice:', seedError.message);
      }
    }

    res.status(200).json(experiences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiences: ' + error.message });
  }
});

// CREATE experience (Admin protected)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { company, role, duration, isCurrent, bannerBg, cardBg, logoType, logoText, logoUrl, socials, order } = req.body;

    if (!company || !role || !duration) {
      return res.status(400).json({ error: 'Company, role, and duration are required.' });
    }

    const experience = new Experience({
      company,
      role,
      duration,
      isCurrent: Boolean(isCurrent),
      bannerBg: bannerBg || '#075153',
      cardBg: cardBg || '',
      logoType: logoType || 'ge',
      logoText: logoText || company,
      logoUrl: logoUrl || '',
      socials: {
        instagram: socials?.instagram || '',
        linkedin: socials?.linkedin || '',
        website: socials?.website || '',
      },
      order: typeof order === 'number' ? order : 0,
    });

    const saved = await experience.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experience: ' + error.message });
  }
});

// UPDATE experience (Admin protected)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { company, role, duration, isCurrent, bannerBg, cardBg, logoType, logoText, logoUrl, socials, order } = req.body;

    const updateData = {};
    if (company !== undefined) updateData.company = company;
    if (role !== undefined) updateData.role = role;
    if (duration !== undefined) updateData.duration = duration;
    if (isCurrent !== undefined) updateData.isCurrent = Boolean(isCurrent);
    if (bannerBg !== undefined) updateData.bannerBg = bannerBg;
    if (cardBg !== undefined) updateData.cardBg = cardBg;
    if (logoType !== undefined) updateData.logoType = logoType;
    if (logoText !== undefined) updateData.logoText = logoText;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (socials !== undefined) {
      updateData.socials = {
        instagram: socials?.instagram || '',
        linkedin: socials?.linkedin || '',
        website: socials?.website || '',
      };
    }
    if (order !== undefined) updateData.order = Number(order);

    const updated = await Experience.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Experience not found.' });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experience: ' + error.message });
  }
});

// DELETE experience (Admin protected)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const deleted = await Experience.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Experience not found.' });
    }
    res.status(200).json({ message: 'Experience deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experience: ' + error.message });
  }
});

module.exports = router;
