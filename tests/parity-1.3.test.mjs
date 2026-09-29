import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, makeWrapper, stubInViewport } from './helpers/loadRuntime.mjs';

describe('1.3.0 Safari settle', () => {
	it('settles entrance: marks completed, cancels WAAPI, clears animations', async () => {
		const { document, abw, window } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'blur-in',
			trigger: 'hover',
			animationMode: 'both',
			delay: 0,
			duration: 20,
			html: '<p>Blur</p>',
		});
		document.body.appendChild(wrap);
		abw.setupWrapper(wrap);
		wrap.dispatchEvent(new window.Event('mouseenter', { bubbles: true }));

		const entrance = [...(wrap.abwAnimations || [])];
		assert.ok(entrance.length);
		await Promise.all(entrance.map((animation) => animation.finished.catch(() => undefined)));
		await new Promise((resolve) => setTimeout(resolve, 30));

		assert.equal(wrap.abwEntranceCompleted, true);
		assert.equal((wrap.abwAnimations || []).length, 0);
		assert.ok(entrance.every((animation) => animation.playState === 'idle'));
	});

	it('still plays exit after settle canceled entrance animations', async () => {
		const { document, abw, window } = createRuntime();
		const hover = makeWrapper(document, {
			preset: 'blur-in',
			trigger: 'hover',
			animationMode: 'both',
			delay: 0,
			duration: 20,
			html: '<p>Hi</p>',
		});
		document.body.appendChild(hover);
		abw.setupWrapper(hover);

		hover.dispatchEvent(new window.Event('mouseenter', { bubbles: true }));
		const entrance = [...(hover.abwAnimations || [])];
		await Promise.all(entrance.map((animation) => animation.finished.catch(() => undefined)));
		await new Promise((resolve) => setTimeout(resolve, 30));

		assert.equal(hover.abwEntranceCompleted, true);
		assert.equal((hover.abwAnimations || []).length, 0);

		hover.dispatchEvent(new window.Event('mouseleave', { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 20));

		assert.ok((hover.abwAnimations || []).length >= 1);
	});
});

describe('1.3.0 join-parent early return', () => {
	it('does not attach scroll observer for followParent children', () => {
		const { document, abw, window } = createRuntime();
		const child = makeWrapper(document, {
			preset: 'fade',
			trigger: 'scroll',
			followParentAnimation: true,
			pending: true,
			html: '<p>Join</p>',
		});
		document.body.appendChild(child);
		const before = window.__ABW_OBSERVERS__.length;
		abw.setupWrapper(child);

		assert.equal(window.__ABW_OBSERVERS__.length, before);
		assert.equal(typeof child.abwReplay, 'undefined');
		assert.ok(!child.classList.contains('abw-pending'));
	});

	it('does not self-play on load when joining parent', async () => {
		const { document, abw, clearAnimateCalls, animateCalls } = createRuntime();
		const child = makeWrapper(document, {
			preset: 'fade',
			trigger: 'load',
			followParentAnimation: true,
			html: '<p>Join</p>',
		});
		document.body.appendChild(child);
		clearAnimateCalls();
		abw.setupWrapper(child);
		await new Promise((resolve) => setTimeout(resolve, 30));

		assert.equal(animateCalls.length, 0);
		// Parent animates the shell — do not prime nested internals (would stick at opacity 0).
		const childContent = child.querySelector('p');
		assert.notEqual(childContent.style.opacity, '0');
	});

	it('leaves joining internals unprimed so parent shell animation can reveal them', () => {
		const { document, abw } = createRuntime();
		const parent = makeWrapper(document, {
			preset: 'fade',
			trigger: 'scroll',
			animationMode: 'in',
			html: '',
		});
		const joining = makeWrapper(document, {
			preset: 'fade',
			trigger: 'scroll',
			followParentAnimation: true,
			html: '<p data-test-id="copy">Copy</p>',
		});
		parent.appendChild(joining);
		document.body.appendChild(parent);

		abw.setupWrapper(parent);
		abw.setupWrapper(joining);

		const copy = joining.querySelector('[data-test-id="copy"]');
		assert.notEqual(copy.style.opacity, '0');
		// Parent primes the joining shell itself.
		assert.equal(joining.style.opacity, '0');
	});
});

describe('1.3.0 scroll IO + rootMargin', () => {
	it('constructs IntersectionObserver with threshold array and rootMargin', () => {
		const { document, abw, window } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'fade',
			trigger: 'scroll',
			animationMode: 'in',
			rootMargin: '0px 0px -10% 0px',
			html: '<p>Scroll</p>',
		});
		wrap.dataset.ffawThreshold = '0.25';
		document.body.appendChild(wrap);
		stubInViewport(wrap, { top: 2000 });
		abw.setupWrapper(wrap);

		const observer = window.__ABW_OBSERVERS__.find((item) => item.elements.has(wrap));
		assert.ok(observer);
		assert.equal(JSON.stringify(observer.options.threshold), JSON.stringify([0, 0.25, 1]));
		assert.equal(observer.options.rootMargin, '0px 0px -10% 0px');
	});

	it('falls back when viewport margin is not a valid rootMargin', () => {
		const { document, abw, window } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'blur-in',
			trigger: 'scroll',
			animationMode: 'in',
			pending: true,
			rootMargin: '10rem',
			html: '<p>Blur</p>',
		});
		wrap.dataset.ffawThreshold = 'nope';
		document.body.appendChild(wrap);
		stubInViewport(wrap, { top: 2000, height: 100, width: 200 });

		assert.doesNotThrow(() => abw.setupWrapper(wrap));
		assert.ok(!wrap.classList.contains('abw-pending'));
		assert.equal(wrap.firstElementChild.style.opacity, '0');
		assert.equal(window.__ABW_OBSERVERS__.length, 1);
		assert.equal(window.__ABW_OBSERVERS__[0].options.rootMargin, '0px');
		assert.equal(JSON.stringify(window.__ABW_OBSERVERS__[0].options.threshold), JSON.stringify([0, 0.25, 1]));
	});

	it('manual viewport check honors rootMargin the same way as IO', () => {
		const { document, abw, window } = createRuntime();
		Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
		Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
		const wrap = makeWrapper(document, {
			preset: 'fade',
			html: '<p>Edge</p>',
		});
		document.body.appendChild(wrap);
		// Fully in normal viewport, but outside a root shrunk by 40% from the bottom.
		stubInViewport(wrap, { top: 700, height: 100, width: 200, left: 10 });

		assert.equal(abw.isWrapperInViewport(wrap, 0.25), true);
		assert.equal(abw.isWrapperInViewport(wrap, 0.25, '0px 0px -40% 0px'), false);
	});
});

describe('1.3.0 settle deadline', () => {
	it('schedules settle watchdog across all bounce iterations', () => {
		const { document, abw, window } = createRuntime();
		const scheduled = [];
		const nativeSetTimeout = window.setTimeout.bind(window);
		window.setTimeout = (fn, ms, ...args) => {
			scheduled.push(Number(ms) || 0);
			return nativeSetTimeout(fn, ms, ...args);
		};

		const wrap = makeWrapper(document, {
			preset: 'bounce-soft',
			trigger: 'click',
			animationMode: 'in',
			delay: 0,
			duration: 100,
			html: '<div>Bounce</div>',
		});
		wrap.dataset.ffawBounceCount = '3';
		document.body.appendChild(wrap);
		abw.setupWrapper(wrap);
		wrap.dispatchEvent(new window.Event('click', { bubbles: true }));

		const entrance = [...(wrap.abwAnimations || [])];
		assert.ok(entrance.length);
		assert.equal(entrance[0].effect.getTiming().iterations, 3);
		// delay(0) + duration(100)*iterations(3) + stagger(0) + 80
		assert.ok(
			scheduled.includes(380),
			`expected settle watchdog of 380ms, got ${JSON.stringify(scheduled)}`
		);
	});

	it('waits for every bounce iteration before restoring split text', () => {
		const { document, abw, window } = createRuntime();
		const scheduled = [];
		const nativeSetTimeout = window.setTimeout.bind(window);
		window.setTimeout = (fn, ms, ...args) => {
			scheduled.push(Number(ms) || 0);
			return nativeSetTimeout(fn, ms, ...args);
		};

		const wrap = makeWrapper(document, {
			preset: 'bounce-soft',
			trigger: 'click',
			animationMode: 'in',
			contentKind: 'text',
			textGranularity: 'word',
			stagger: 0,
			delay: 0,
			duration: 100,
			html: '<p>Hello there</p>',
		});
		wrap.dataset.ffawBounceCount = '3';
		document.body.appendChild(wrap);
		abw.setupWrapper(wrap);
		wrap.dispatchEvent(new window.Event('click', { bubbles: true }));

		// Two words use the default 55ms step when stagger is 0.
		// delay(0) + duration(100)*iterations(3) + stagger(55) + 40
		assert.ok(
			scheduled.includes(395),
			`expected text restore at 395ms, got ${JSON.stringify(scheduled)}`
		);
	});

	it('does not restore visible text after a canceled entrance', async () => {
		const { document, abw, window } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'fade',
			trigger: 'load',
			animationMode: 'in',
			contentKind: 'text',
			delay: 0,
			duration: 20,
			html: '<p>Hello there</p>',
		});
		document.body.appendChild(wrap);
		abw.setupWrapper(wrap);

		await new Promise((resolve) => window.requestAnimationFrame(resolve));
		assert.ok(wrap.querySelector('.abw-text-unit'));
		abw.cancelPendingEntrance(wrap);

		await new Promise((resolve) => window.setTimeout(resolve, 180));
		assert.ok(wrap.querySelector('.abw-text-unit'));
		assert.equal(wrap.querySelector('.abw-text-unit').style.opacity, '0');
	});
});

describe('1.3.0 abw-pending', () => {
	it('clears pending class after setup primes', () => {
		const { document, abw } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'fade',
			trigger: 'scroll',
			animationMode: 'in',
			pending: true,
			html: '<p>Pending</p>',
		});
		document.body.appendChild(wrap);
		stubInViewport(wrap, { top: 2000 });
		abw.setupWrapper(wrap);
		assert.ok(!wrap.classList.contains('abw-pending'));
	});
});

describe('1.3.0 layout stagger + marked targets', () => {
	it('uses marked abw-stagger-item children as targets', () => {
		const { document, abw } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'fade',
			trigger: 'scroll',
			contentKind: 'layout',
			html: '',
		});
		const marked = document.createElement('div');
		marked.className = 'abw-stagger-item';
		marked.dataset.testId = 'marked';
		marked.textContent = 'A';
		const unmarked = document.createElement('div');
		unmarked.dataset.testId = 'unmarked';
		unmarked.textContent = 'B';
		wrap.append(marked, unmarked);

		const targets = abw.getAnimationTargets(wrap, 'fade', 'word');
		assert.equal(targets.length, 1);
		assert.equal(targets[0], marked);
	});

	it('applies non-text stagger delays across children', () => {
		const { document, abw, clearAnimateCalls, animateCalls, window } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'fade',
			trigger: 'click',
			animationMode: 'in',
			contentKind: 'layout',
			stagger: 50,
			delay: 0,
			duration: 20,
			html: '',
		});
		const a = document.createElement('div');
		a.textContent = 'A';
		const b = document.createElement('div');
		b.textContent = 'B';
		wrap.append(a, b);
		document.body.appendChild(wrap);
		abw.setupWrapper(wrap);
		clearAnimateCalls();
		wrap.dispatchEvent(new window.Event('click', { bubbles: true }));

		assert.ok(animateCalls.length >= 2);
		const delays = animateCalls.map((call) => Number(call.options.delay)).sort((x, y) => x - y);
		assert.equal(delays[0], 0);
		assert.equal(delays[1], 50);
		assert.ok(animateCalls.every((call) => call.options.fill === 'both'));
	});

	it('pulls kerning pairs together and leaves unkerned pairs alone', () => {
		const { document, abw, window } = createRuntime();
		const fonts = [];
		window.HTMLCanvasElement.prototype.getContext = function getContext() {
			const state = { font: '' };
			return {
				set font(value) {
					state.font = value;
					fonts.push(value);
				},
				get font() {
					return state.font;
				},
				measureText(text) {
					const widths = { Y: 12, o: 10, Yo: 20, a: 8, b: 8, ab: 16 };
					return { width: Object.prototype.hasOwnProperty.call(widths, text) ? widths[text] : String(text).length * 8 };
				},
			};
		};

		const style = document.createElement('style');
		style.textContent = '.abw-text-unit-char{font:16px TestFont;} strong .abw-text-unit-char{font:700 16px BoldFont;}';
		document.head.appendChild(style);

		const wrap = makeWrapper(document, {
			preset: 'letter-pop',
			trigger: 'scroll',
			animationMode: 'in',
			contentKind: 'text',
			textGranularity: 'character',
			html: '<p>Yo <strong>ab</strong></p>',
		});
		document.body.appendChild(wrap);
		stubInViewport(wrap, { top: 2000, height: 40, width: 200 });
		abw.setupWrapper(wrap);

		const words = [...wrap.querySelectorAll('.abw-text-word')];
		const yo = [...words[0].querySelectorAll('.abw-text-unit-char')];
		const plain = [...words[1].querySelectorAll('.abw-text-unit-char')];
		assert.equal(yo[0].textContent, 'Y');
		assert.equal(yo[0].style.marginRight, '-2px');
		assert.equal(yo[1].style.marginRight, '');
		assert.equal(plain[0].style.marginRight, '');
		assert.equal(plain[1].style.marginRight, '');
		assert.ok(fonts.includes(window.getComputedStyle(yo[0]).font));
		assert.ok(fonts.includes(window.getComputedStyle(plain[0]).font));
	});

	it('holds the invisible from-frame for staggered text entrances', () => {
		const { document, abw, clearAnimateCalls, animateCalls, window } = createRuntime();
		const wrap = makeWrapper(document, {
			preset: 'blur-in',
			trigger: 'load',
			animationMode: 'in',
			contentKind: 'text',
			textGranularity: 'character',
			stagger: 18,
			delay: 0,
			duration: 400,
			html: '<h1>Lift</h1>',
		});
		document.body.appendChild(wrap);
		clearAnimateCalls();
		abw.setupWrapper(wrap);

		const heading = wrap.querySelector('h1');
		const units = [...wrap.querySelectorAll('.abw-text-unit')];
		assert.ok(units.length > 1);
		assert.ok(units.every((unit) => unit.style.opacity === '0'));
		assert.equal(heading.style.opacity, '');

		// Load plays on the next frame; flush that callback.
		return new Promise((resolve) => {
			window.requestAnimationFrame(() => {
				assert.ok(animateCalls.length >= units.length);
				assert.ok(animateCalls.every((call) => call.options.fill === 'both'));
				const delays = animateCalls.map((call) => Number(call.options.delay));
				assert.ok(delays.some((delay) => delay > 0));
				assert.ok(animateCalls.every((call) => call.keyframes[0].opacity === 0));
				resolve();
			});
		});
	});
});
