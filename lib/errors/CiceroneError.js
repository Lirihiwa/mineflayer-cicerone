class CiceroneError extends Error {
    constructor(message, { cause } = {}) {
        super(`[Cicerone] ${message}`, { cause });
        this.name = 'CiceroneError';
    }
}

module.exports = CiceroneError;
