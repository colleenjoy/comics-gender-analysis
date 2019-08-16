// do i need to import?
const characters = marvelapishit;
const svg = d3
  .select('#issues-per-character')
  .selectAll('svg')
  .data(characters)
  .append('svg');
