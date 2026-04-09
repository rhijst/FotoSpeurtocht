module.exports = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = { userId, role };
  next();
};
