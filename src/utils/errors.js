'use strict';

class DevPulseError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name  = 'DevPulseError';
    this.code  = code  || 'UNKNOWN';
    this.details = details || {};
  }
}

class PackageNotFoundError extends DevPulseError {
  constructor(dir) {
    super(`No package.json found in: ${dir}`, 'PKG_NOT_FOUND', { dir });
    this.name = 'PackageNotFoundError';
  }
}

class InvalidPackageError extends DevPulseError {
  constructor(message, dir) {
    super(`Invalid package.json in ${dir}: ${message}`, 'INVALID_PKG', { dir, parseError: message });
    this.name = 'InvalidPackageError';
  }
}

class DirectoryNotFoundError extends DevPulseError {
  constructor(dir) {
    super(`Directory not found: ${dir}`, 'DIR_NOT_FOUND', { dir });
    this.name = 'DirectoryNotFoundError';
  }
}

module.exports = { DevPulseError, PackageNotFoundError, InvalidPackageError, DirectoryNotFoundError };
