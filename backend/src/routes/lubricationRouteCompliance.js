const express = require('express');

const router = express.Router();

let routes = [
  { id: 1, assetRoute: 'Press line bearings', technician: 'J. Lee', pointsDue: 18, pointsCompleted: 17, lubricant: 'ISO VG 220', exception: 'Guard lockout pending', status: 'at risk' },
  { id: 2, assetRoute: 'Compressor room', technician: 'M. Patel', pointsDue: 12, pointsCompleted: 12, lubricant: 'Synthetic compressor oil', exception: 'None', status: 'complete' },
  { id: 3, assetRoute: 'Packaging conveyors', technician: 'S. Rivera', pointsDue: 24, pointsCompleted: 20, lubricant: 'Food grade grease', exception: 'Two zerks damaged', status: 'open' }
];

router.get('/', (req, res) => {
  const summary = routes.reduce((acc, row) => {
    acc.total += 1;
    acc.pointsDue += Number(row.pointsDue || 0);
    acc.pointsCompleted += Number(row.pointsCompleted || 0);
    acc.atRisk += row.status === 'at risk' ? 1 : 0;
    return acc;
  }, { total: 0, pointsDue: 0, pointsCompleted: 0, atRisk: 0 });
  res.json({ routes, summary });
});

router.post('/', (req, res) => {
  const item = {
    id: Date.now(),
    assetRoute: req.body.assetRoute || 'Unassigned lubrication route',
    technician: req.body.technician || 'Unassigned',
    pointsDue: Number(req.body.pointsDue || 0),
    pointsCompleted: Number(req.body.pointsCompleted || 0),
    lubricant: req.body.lubricant || 'Standard lubricant',
    exception: req.body.exception || 'None',
    status: req.body.status || 'open'
  };
  routes = [item, ...routes];
  res.status(201).json(item);
});

module.exports = router;
