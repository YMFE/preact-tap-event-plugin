import { options } from 'preact';


const OPTS = {
	// # of pixels after which to discount as drag op
	threshold: 10
};

let injected = false;

let hasTouch;


// in case someone calls inject():
export default opts => {
	for (let i in opts) if (opts.hasOwnProperty(i)) OPTS[i] = opts[i];

	if (injected) return;

	let oldHook = options.vnode;
	options.vnode = vnode => {
		let attrs = vnode.attributes;
		if (attrs) {
			for (let i in attrs) {
				if (attrs.hasOwnProperty(i) && i.toLowerCase()==='ontouchtap') {
					proxy(attrs);
					break;
				}
			}
		}
		if (oldHook) oldHook(vnode);
	};
};


function proxy(attrs) {
	let map = {};
	for (let i in attrs) if (attrs.hasOwnProperty(i)) {
		map[i.toLowerCase()] = i;
	}

	let start = attrs[map.ontouchstart],
		end = attrs[map.ontouchend],
		tap = attrs[map.ontouchtap],
		click = attrs[map.onclick];

	delete attrs[map.ontouchtap];

	attrs[map.onclick || 'onClick'] = e => {
		if (click) click(e);
		if (!hasTouch) return tap(e);
	};

	attrs[map.ontouchstart || 'onTouchStart'] = e => {
		let touch = coords(e);
		hasTouch = true;
		getTarget(touch)._touchDown = touch;
		if (start) return start(e);
	};

	attrs[map.ontouchend || 'onTouchEnd'] = e => {
		let up = coords(e),
			ret = end && end(e),
			down = getTarget(up)._touchDown,
			dist = Math.sqrt( Math.pow(up.x-down.x,2) + Math.pow(up.y-down.y,2) );
		if (down && ret!==false && dist<OPTS.threshold) tap(e);
		return ret;
	};
}


function coords(e) {
	let t = e.changedTouches && e.changedTouches[0] || e.touches && e.touches[0] || e;
	return { x: t.pageX, y: t.pageY, target: t.target };
}


function getTarget(e) {
	let t = e.target;
	return t.nodeType===3 ? t.parentNode : t;
}
