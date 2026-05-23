const ADMIN_SESSION_TOKEN = 'bitebest-admin-session';

const protectAdminRoute = (req, res, next) => {
  const adminSession = req.header('x-admin-session');

  if (adminSession !== ADMIN_SESSION_TOKEN) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  next();
};

module.exports = protectAdminRoute;
