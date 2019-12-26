// TODO: extract utility
// TODO: refactor params to present nicer API
function formatStyle(style) {
  return ['<style>', style, '</style>'].join('');
}

export { formatStyle };
