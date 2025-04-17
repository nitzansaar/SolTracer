module.exports = {
  require: 'ts-node/register',
  extension: ['ts'],
  timeout: 60000,  // 60 seconds
  'node-option': [
    'experimental-specifier-resolution=node',
    'loader=ts-node/esm'
  ],
  exit: true
}; 