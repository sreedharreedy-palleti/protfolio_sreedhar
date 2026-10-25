const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const About = require('../models/About');
const PortfolioContent = require('../models/PortfolioContent');
const { verifyAdmin } = require('../middleware/auth.middleware');

let defaultResumeData = {
  url: '',
  data: '',
  fileName: 'Venkata_Sreedhar_Reddy_Resume.pdf',
  fileSize: '4.6 KB',
  uploadedAt: new Date().toISOString(),
};
try {
  const jsonPath = path.join(__dirname, '../data/default_resume_base64.json');
  if (fs.existsSync(jsonPath)) {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    defaultResumeData = {
      url: raw.url || '',
      data: raw.data || '',
      fileName: raw.fileName || 'Venkata_Sreedhar_Reddy_Resume.pdf',
      fileSize: raw.fileSize || '4.6 KB',
      uploadedAt: raw.uploadedAt || new Date().toISOString(),
    };
  }
} catch (e) {
  // Silent fallback
}

const DEFAULT_ABOUT = {
  title: 'About Me',
  subtitle: 'My introduction',
  sectionBadge: 'Profile & Background',
  sectionTitle: 'About Me',
  sectionSubtitle: 'My introduction',
  cardBadge: 'ENGINEERING PHILOSOPHY',
  headline: 'Bridging engineering precision with human-centric interfaces',
  text: 'Senior Software Engineer with 6+ years of experience building scalable cloud-native applications, data platforms, and analytics solutions. I specialize in Java, Spring Boot, Python, React, Azure, Kubernetes, and Apache Superset, with a strong interest in open-source technologies, AI-powered products, and data-driven innovation.',
  stats: [
    { value: '06+', label: 'Years experience' },
    { value: '05', label: 'Companies Work' },
    { value: '15+', label: 'Technical Skills' },
  ],
  cv: defaultResumeData,
  keyPoints: [
    'Specialized in CSE & Data Science fundamentals',
    'Extensive real-world experience across frontend and backend services',
    'Passionate about automated testing, CI/CD, and maintainable codebases',
  ],
  location: 'Andhra Pradesh, India',
  email: 'palletisreedharreddy82@gmail.com',
  availability: 'Open for Roles',
};

// Helper to keep PortfolioContent in sync
async function syncPortfolioContentAbout(aboutData) {
  try {
    let content = await PortfolioContent.findOne();
    if (content) {
      content.about = {
        title: aboutData.title || DEFAULT_ABOUT.title,
        subtitle: aboutData.subtitle || DEFAULT_ABOUT.subtitle,
        sectionBadge: aboutData.sectionBadge,
        sectionTitle: aboutData.sectionTitle,
        sectionSubtitle: aboutData.sectionSubtitle,
        cardBadge: aboutData.cardBadge,
        headline: aboutData.headline,
        text: aboutData.text,
        stats: Array.isArray(aboutData.stats) ? aboutData.stats : DEFAULT_ABOUT.stats,
        cv: aboutData.cv || DEFAULT_ABOUT.cv,
        keyPoints: aboutData.keyPoints,
        location: aboutData.location,
        email: aboutData.email,
        availability: aboutData.availability,
      };
      await content.save();
    }
  } catch (err) {
    console.warn('PortfolioContent sync warning:', err.message);
  }
}

// 1. READ: GET /api/about (Public)
router.get('/', async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      const content = await PortfolioContent.findOne();
      if (content && content.about && (content.about.text || content.about.title)) {
        about = await About.create({
          title: content.about.title || DEFAULT_ABOUT.title,
          subtitle: content.about.subtitle || DEFAULT_ABOUT.subtitle,
          sectionBadge: content.about.sectionBadge || DEFAULT_ABOUT.sectionBadge,
          sectionTitle: content.about.sectionTitle || DEFAULT_ABOUT.sectionTitle,
          sectionSubtitle: content.about.sectionSubtitle || DEFAULT_ABOUT.sectionSubtitle,
          cardBadge: content.about.cardBadge || DEFAULT_ABOUT.cardBadge,
          headline: content.about.headline || DEFAULT_ABOUT.headline,
          text: content.about.text || DEFAULT_ABOUT.text,
          stats: Array.isArray(content.about.stats) && content.about.stats.length > 0
            ? content.about.stats
            : DEFAULT_ABOUT.stats,
          cv: content.about.cv || DEFAULT_ABOUT.cv,
          keyPoints: Array.isArray(content.about.keyPoints) && content.about.keyPoints.length > 0
            ? content.about.keyPoints
            : DEFAULT_ABOUT.keyPoints,
          location: content.about.location || content.contactInfo?.location || DEFAULT_ABOUT.location,
          email: content.about.email || content.contactInfo?.email || DEFAULT_ABOUT.email,
          availability: content.about.availability || DEFAULT_ABOUT.availability,
        });
      } else {
        about = await About.create(DEFAULT_ABOUT);
      }
    }
    res.status(200).json(about);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch about data: ' + error.message });
  }
});

// 2. CREATE / INITIALIZE: POST /api/about (Admin Only)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    let about = await About.findOne();
    if (about) {
      Object.assign(about, req.body);
    } else {
      about = new About({ ...DEFAULT_ABOUT, ...req.body });
    }
    const saved = await about.save();
    await syncPortfolioContentAbout(saved);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create about section: ' + error.message });
  }
});

// 3. UPDATE: PUT /api/about (Admin Only)
router.put('/', verifyAdmin, async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = new About(DEFAULT_ABOUT);
    }

    if (req.body.title !== undefined) about.title = req.body.title;
    if (req.body.subtitle !== undefined) about.subtitle = req.body.subtitle;
    if (req.body.sectionBadge !== undefined) about.sectionBadge = req.body.sectionBadge;
    if (req.body.sectionTitle !== undefined) about.sectionTitle = req.body.sectionTitle;
    if (req.body.sectionSubtitle !== undefined) about.sectionSubtitle = req.body.sectionSubtitle;
    if (req.body.cardBadge !== undefined) about.cardBadge = req.body.cardBadge;
    if (req.body.headline !== undefined) about.headline = req.body.headline;
    if (req.body.text !== undefined) about.text = req.body.text;
    if (Array.isArray(req.body.stats)) about.stats = req.body.stats;
    if (req.body.cv !== undefined) {
      about.cv = {
        url: req.body.cv.url !== undefined ? req.body.cv.url : (about.cv?.url || ''),
        data: req.body.cv.data !== undefined ? req.body.cv.data : (about.cv?.data || ''),
        fileName: req.body.cv.fileName !== undefined ? req.body.cv.fileName : (about.cv?.fileName || ''),
        fileSize: req.body.cv.fileSize !== undefined ? req.body.cv.fileSize : (about.cv?.fileSize || ''),
        uploadedAt: req.body.cv.uploadedAt !== undefined ? req.body.cv.uploadedAt : (about.cv?.uploadedAt || ''),
      };
    }
    if (Array.isArray(req.body.keyPoints)) about.keyPoints = req.body.keyPoints;
    if (req.body.location !== undefined) about.location = req.body.location;
    if (req.body.email !== undefined) about.email = req.body.email;
    if (req.body.availability !== undefined) about.availability = req.body.availability;

    const updated = await about.save();
    await syncPortfolioContentAbout(updated);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update about section: ' + error.message });
  }
});

// 4. CV UPLOAD: POST /api/about/cv (Admin Only)
router.post('/cv', verifyAdmin, async (req, res) => {
  try {
    const { data, fileName, fileSize, url } = req.body;
    if (!data && !url) {
      return res.status(400).json({ error: 'Either base64 file data or direct CV URL is required.' });
    }

    let about = await About.findOne();
    if (!about) {
      about = new About(DEFAULT_ABOUT);
    }

    about.cv = {
      url: url || '',
      data: data || '',
      fileName: fileName || (url ? 'CV_Document.pdf' : 'Uploaded_CV.pdf'),
      fileSize: fileSize || '',
      uploadedAt: new Date().toISOString(),
    };

    const saved = await about.save();
    await syncPortfolioContentAbout(saved);
    res.status(200).json({ message: 'CV uploaded and stored successfully in MongoDB.', cv: saved.cv });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload CV: ' + error.message });
  }
});

// 5. CV DELETE / REMOVE: DELETE /api/about/cv (Admin Only)
router.delete('/cv', verifyAdmin, async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = new About(DEFAULT_ABOUT);
    }

    about.cv = {
      url: '',
      data: '',
      fileName: '',
      fileSize: '',
      uploadedAt: '',
    };

    const saved = await about.save();
    await syncPortfolioContentAbout(saved);
    res.status(200).json({ message: 'CV removed successfully from MongoDB.', cv: saved.cv });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove CV: ' + error.message });
  }
});

// 6. ADD KEYPOINT: POST /api/about/keypoint (Admin Only)
router.post('/keypoint', verifyAdmin, async (req, res) => {
  try {
    const { keyPoint } = req.body;
    if (!keyPoint || !keyPoint.trim()) {
      return res.status(400).json({ error: 'Key point text is required.' });
    }

    let about = await About.findOne();
    if (!about) {
      about = new About(DEFAULT_ABOUT);
    }

    about.keyPoints.push(keyPoint.trim());
    const updated = await about.save();
    await syncPortfolioContentAbout(updated);
    res.status(200).json({ keyPoints: updated.keyPoints, message: 'Key point added successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add key point: ' + error.message });
  }
});

// 7. DELETE KEYPOINT: DELETE /api/about/keypoint/:index (Admin Only)
router.delete('/keypoint/:index', verifyAdmin, async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid index parameter.' });
    }

    let about = await About.findOne();
    if (!about) {
      return res.status(404).json({ error: 'About section not found.' });
    }

    if (index < 0 || index >= about.keyPoints.length) {
      return res.status(400).json({ error: 'Index out of bounds.' });
    }

    about.keyPoints.splice(index, 1);
    const updated = await about.save();
    await syncPortfolioContentAbout(updated);
    res.status(200).json({ keyPoints: updated.keyPoints, message: 'Key point removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove key point: ' + error.message });
  }
});

// 8. DELETE / RESET: DELETE /api/about (Admin Only)
router.delete('/', verifyAdmin, async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = new About(DEFAULT_ABOUT);
    } else {
      Object.assign(about, DEFAULT_ABOUT);
    }
    const reset = await about.save();
    await syncPortfolioContentAbout(reset);
    res.status(200).json({ message: 'About section reset to default values.', about: reset });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset about section: ' + error.message });
  }
});

// 9. PUBLIC RESUME DOWNLOAD: GET /api/about/cv/download (Accessible to ANY user / recruiter)
router.get('/cv/download', async (req, res) => {
  try {
    const about = await About.findOne();
    const cv = about?.cv;

    // 1. If CV base64 data exists in MongoDB
    if (cv?.data && cv.data.trim()) {
      const fileName = cv.fileName || 'Venkata_Sreedhar_Reddy_Resume.pdf';
      const matches = cv.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(cv.data, 'base64');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    }

    // 2. If an external URL is configured (e.g. Google Drive, Cloudinary)
    if (cv?.url && cv.url.trim()) {
      return res.redirect(cv.url);
    }

    // 3. Fallback: Serve the pre-bundled resume PDF from Backend data
    const defaultPath = path.join(__dirname, '../data/default_resume.pdf');
    if (fs.existsSync(defaultPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Venkata_Sreedhar_Reddy_Resume.pdf"');
      return res.sendFile(defaultPath);
    }

    // 4. Fallback: Frontend public resume
    const frontendPublicPath = path.join(__dirname, '../../Frontend/public/resume.pdf');
    if (fs.existsSync(frontendPublicPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Venkata_Sreedhar_Reddy_Resume.pdf"');
      return res.sendFile(frontendPublicPath);
    }

    res.status(404).json({ error: 'Resume document not found.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download resume: ' + error.message });
  }
});

// Alias: GET /api/about/resume
router.get('/resume', (req, res) => {
  res.redirect('/api/about/cv/download');
});

module.exports = router;
