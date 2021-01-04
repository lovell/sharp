module.exports = async function () {
  if (global.gc) {
    global.gc();
  }
};
