//Override logging functions
const log   = console.log;
const error = console.error;

console.log   = (data) => data && data != '\n' && log(data);
console.error = (data) => data && data != '\n' && error(data);