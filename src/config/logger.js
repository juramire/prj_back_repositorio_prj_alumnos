export const logInfo = (msg, meta = {}) => {
  console.log(JSON.stringify({ level: 'info', msg, ...meta }));
};

export const logError = (msg, meta = {}) => {
  console.error(JSON.stringify({ level: 'error', msg, ...meta }));
};
