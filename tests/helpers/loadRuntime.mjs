import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIEW_SOURCE = readFileSync(join(__dirname, '../../src/view.js'), 'utf8');
const STYLE_SOURCE = readFileSync(join(__dirname, '../../build/style.css'), 'utf8');

function installAnimateMock(window) {
	window.Element.prototype.animate = function animate(keyframes, options = {}) {
		const delay = Number(options.delay) || 0;
		const duration = Number(options.duration) || 0;
		const startedAt = Date.now();
		let playState = 'running';
		let currentTime = 0;
		const finished = new Promise((resolve) => {
			const total = delay + duration;
			setTimeout(() => {
				if (playState === 'running') {
					playState = 'finished';
					currentTime = total;
					resolve();
				}
			}, Math.min(Math.max(total, 1), 40));
		});
		return {
			finished,
			get playState() {
				return playState;
			},
			get currentTime() {
				if (playState === 'finished') {
					return delay + duration;
				}
				if (playState === 'idle') {
					return currentTime;
				}
				return Math.min(Date.now() - startedAt, delay + duration);
			},
			effect: {
				getTiming() {
					return { delay, duration };
				},
			},
			cancel() {
				playState = 'idle';
			},
		};
	};
}

function installMatchMedia(window) {
	window.matchMedia = window.matchMedia || function matchMedia() {
		return {
			matches: false,
			media: '',
			addEventListener() {},
			removeEventListener() {},
			addListener() {},
			removeListener() {},
		};
	};
}

function installIntersectionObserver(window) {
	window.IntersectionObserver = class IntersectionObserver {
		constructor(callback) {
			this.callback = callback;
			this.elements = new Set();
		}
		observe(el) {
			this.elements.add(el);
		}
		unobserve(el) {
			this.elements.delete(el);
		}
		disconnect() {
			this.elements.clear();
		}
		trigger(entries) {
			this.callback(entries, this);
		}
	};
}

export function createRuntime(html = '<!DOCTYPE html><html><body></body></html>') {
	const dom = new JSDOM(html, {
		url: 'https://example.test/',
		pretendToBeVisual: true,
		runScripts: 'outside-only',
	});
	const { window } = dom;
	installAnimateMock(window);
	installMatchMedia(window);
	installIntersectionObserver(window);

	const style = window.document.createElement('style');
	style.textContent = STYLE_SOURCE;
	window.document.head.appendChild(style);

	const context = dom.getInternalVMContext();
	context.__ABW_TEST__ = true;
	vm.runInContext(VIEW_SOURCE, context);

	return {
		window,
		document: window.document,
		abw: window.__ABW,
		dom,
	};
}

export function makeWrapper(document, {
	preset = 'fade',
	trigger = 'scroll',
	animationMode,
	exitMode,
	once,
	followParentAnimation = false,
	inheritParentDelay = false,
	hideUntilHover = false,
	contentKind = 'mixed',
	delay = 0,
	duration = 700,
	direction = 'up',
	className = '',
	html = '<p>Content</p>',
} = {}) {
	const el = document.createElement('div');
	el.className = `wp-block-animation-block-wrapper-wrapper abw-wrapper ${className}`.trim();
	el.dataset.ffawPreset = preset;
	el.dataset.ffawTrigger = trigger;
	el.dataset.ffawContentKind = contentKind;
	el.dataset.ffawDirection = direction;
	el.dataset.ffawDelay = String(delay);
	el.dataset.ffawDuration = String(duration);
	el.dataset.ffawOnce = once === false ? '0' : '1';
	el.dataset.ffawFollowParentAnimation = followParentAnimation ? '1' : '0';
	el.dataset.ffawInheritParentDelay = inheritParentDelay ? '1' : '0';
	el.dataset.ffawHideUntilHover = hideUntilHover ? '1' : '0';
	if (animationMode) {
		el.dataset.ffawAnimationMode = animationMode;
	}
	if (exitMode) {
		el.dataset.ffawExitMode = exitMode;
	}
	el.innerHTML = html;
	return el;
}

export function computedOpacity(document, element) {
	return document.defaultView.getComputedStyle(element).opacity;
}
