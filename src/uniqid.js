/**
 * Generates a unique ID based on the current time in microseconds,
 * mimicking PHP's uniqid() function.
 * 
 * @param {string} prefix - Optional prefix to prepend to the ID.
 * @param {boolean} moreEntropy - If true, adds additional entropy (using Math.random).
 * @returns {string} The generated unique ID.
 */
export default function uniqid(prefix = '', moreEntropy = false) {
	const time = Date.now();
	const sec = Math.floor(time / 1000);
	const msec = time % 1000;

	// Get microseconds (performance.now() fractional part gives sub-millisecond resolution)
	const usec = Math.floor((performance.now() % 1) * 1000) + (msec * 1000);

	let id = sec.toString(16).padStart(8, '0') + usec.toString(16).padStart(5, '0');

	if (moreEntropy) {
		// Mimics PHP's extra entropy (dots + 8 additional characters/numbers)
		id += '.' + Math.random().toFixed(8).slice(2, 10);
	}

	return prefix + id;
}