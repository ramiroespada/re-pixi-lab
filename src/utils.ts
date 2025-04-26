export function constrain(n: number, low: number, high: number): number {
	return Math.max(Math.min(n, high), low);
}

export function map(
	n: number,
	start1: number,
	stop1: number,
	start2: number,
	stop2: number,
	withinBounds?: boolean
): number {
	const newval = ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
	if (!withinBounds) {
		return newval;
	}
	if (start2 < stop2) {
		return constrain(newval, start2, stop2);
	} else {
		return constrain(newval, stop2, start2);
	}
}

export function dist(p1X: number, p1Y: number, p2X: number, p2Y: number) {
	const p1a = p1X - p2X;
	const p2a = p1Y - p2Y;
	return Math.round(Math.sqrt(p1a * p1a + p2a * p2a));
}

//@ts-expect-error No type needed
export function onlyUnique(value, index, array) {
	return array.indexOf(value) === index;
}

export function screenLockPortrait() {
	try {
		const screenOrientation = window.screen.orientation;
		if (screenOrientation) {
			//@ts-expect-error No type needed
			screenOrientation.lock("portrait");
		}
	} catch (error) {
		console.log("Cannot lock screen orientation: ", error);
	}
}

/* eslint-disable-next-line */ //@ts-expect-error Let this without type
export function openFullscreen(elem) {
	if (elem.requestFullscreen) {
		elem.requestFullscreen();
	} else if (elem.webkitRequestFullscreen) { /* Safari */
		elem.webkitRequestFullscreen();
	} else if (elem.msRequestFullscreen) { /* IE11 */
		elem.msRequestFullscreen();
	}
}

/* Close fullscreen */
//@ts-expect-error No type needed
export function closeFullscreen(document) {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.webkitExitFullscreen) { /* Safari */
		document.webkitExitFullscreen();
	} else if (document.msExitFullscreen) { /* IE11 */
		document.msExitFullscreen();
	}
}

export function lerp(x: number, x0: number, x1: number, y0: number = 0, y1: number = 1): number {
	if (x0 === x1) {
		return 0;
	}
	return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

//@ts-expect-error No type needed
export function binaryToType(nw, ne, se, sw) {
	/* eslint-disable @typescript-eslint/no-explicit-any */
	const a: Array<any> = [nw, ne, se, sw];
	return a.reduce((res, x) => (res << 1) | x);
}