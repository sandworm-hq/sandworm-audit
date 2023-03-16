class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

module.exports = {
  UsageError,
};
