module.exports = {
  "db": {
    "host": process.env.MONGODB_HOST,
    "port": process.env.MONGODB_PORT,
    "database": process.env.MONGODB_DATABASE,
    "username": process.env.MONGODB_USER,
    "password": process.env.MONGODB_PASSWORD,
    "name": "db",
    "connector": "mongodb",
    "useNewUrlParser": "true"
  }
};
