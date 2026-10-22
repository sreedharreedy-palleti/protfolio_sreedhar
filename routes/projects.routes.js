const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { verifyAdmin } = require('../middleware/auth.middleware');

function extractPoints(content) {
  if (!content) return [];
  if (Array.isArray(content)) return content.map(String).filter(Boolean);
  if (typeof content !== 'string') return [String(content)];
  const trimmed = content.trim();
  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map((l) => l.replace(/^[\s•\-*\d.]+\s*/, '').trim())
      .filter(Boolean);
  }
  if (trimmed.includes('•')) {
    return trimmed
      .split('•')
      .map((l) => l.trim())
      .filter(Boolean);
  }
  const sentences = trimmed
    .split(/(?<=\.)\s+/)
    .map((s) => s.replace(/^[\s•\-*\d.]+\s*/, '').trim())
    .filter(Boolean);
  if (sentences.length > 1) return sentences;
  return [trimmed];
}

// GET all projects
router.get('/', async (req, res) => {
  try {
    let projects = await Project.find().sort({ createdAt: -1 });

    // If database has no projects yet, auto-seed with initial project data
    if (!projects || projects.length === 0) {
      try {
        const initialProjects = require('../data/projects.data');
        if (Array.isArray(initialProjects) && initialProjects.length > 0) {
          const seeded = await Project.insertMany(
            initialProjects.map((p) => {
              const text = p.content || p.description || '';
              return {
                title: p.title,
                content: text,
                description: text,
                points: extractPoints(text),
                liveDemo: p.liveDemo || p.live || '',
                live: p.live || p.liveDemo || '',
                tech: p.tech || [],
                github: p.github || '',
              };
            })
          );
          projects = seeded;
        }
      } catch (seedError) {
        console.warn('Initial project seeding notice:', seedError.message);
      }
    }

    // Normalize output so title, content, points, liveDemo are always provided
    const normalizedProjects = projects.map((p) => {
      const doc = p.toObject ? p.toObject() : p;
      const content = doc.content || doc.description || '';
      const points = Array.isArray(doc.points) && doc.points.length > 0
        ? doc.points
        : extractPoints(content);
      const liveDemo = doc.liveDemo || doc.live || '';

      return {
        ...doc,
        content,
        description: content,
        points,
        liveDemo,
        live: liveDemo,
      };
    });

    res.status(200).json(normalizedProjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects: ' + error.message });
  }
});

// CREATE project (title, content, points, live demo)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { title, content, description, liveDemo, live, tech, github } = req.body;
    const projectContent = content !== undefined ? content : description;
    const projectLiveDemo = liveDemo !== undefined ? liveDemo : live;

    if (!title || !projectContent) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const text = projectContent.trim();
    const project = new Project({
      title: title.trim(),
      content: text,
      description: text,
      points: extractPoints(text),
      liveDemo: (projectLiveDemo || '').trim(),
      live: (projectLiveDemo || '').trim(),
      tech: Array.isArray(tech) ? tech : (tech ? tech.split(',').map((t) => t.trim()) : []),
      github: (github || '').trim(),
    });

    const saved = await project.save();
    const doc = saved.toObject();
    res.status(201).json({
      ...doc,
      content: doc.content || doc.description,
      points: doc.points || extractPoints(doc.content || doc.description),
      liveDemo: doc.liveDemo || doc.live,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project: ' + error.message });
  }
});

// UPDATE project (title, content, points, live demo)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, content, description, liveDemo, live, tech, github } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();

    if (content !== undefined || description !== undefined) {
      const projectContent = (content !== undefined ? content : description).trim();
      updateData.content = projectContent;
      updateData.description = projectContent;
      updateData.points = extractPoints(projectContent);
    }

    if (liveDemo !== undefined || live !== undefined) {
      const projectLiveDemo = liveDemo !== undefined ? liveDemo : live;
      updateData.liveDemo = projectLiveDemo;
      updateData.live = projectLiveDemo;
    }

    if (tech !== undefined) {
      updateData.tech = Array.isArray(tech)
        ? tech
        : tech ? tech.split(',').map((t) => t.trim()) : [];
    }

    if (github !== undefined) {
      updateData.github = (github || '').trim();
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    const doc = updated.toObject();
    res.status(200).json({
      ...doc,
      content: doc.content || doc.description,
      points: doc.points || extractPoints(doc.content || doc.description),
      liveDemo: doc.liveDemo || doc.live,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project: ' + error.message });
  }
});

// DELETE project
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.status(200).json({ message: 'Project removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project: ' + error.message });
  }
});

module.exports = router;