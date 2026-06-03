const PRESET_KEYFRAMES = {
	'blur-in': [
		{ opacity: 0, filter: 'blur(8px)' },
		{ opacity: 1, filter: 'blur(0px)' },
	],
	'text-rise': [
		{ opacity: 0, transform: 'translate3d(0, 14px, 0)' },
		{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
	],
	'word-cascade': [
		{ opacity: 0, transform: 'translate3d(0, 10px, 0)' },
		{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
	],
	'letter-pop': [
		{ opacity: 0, transform: 'scale(0.88) translate3d(0, 6px, 0)' },
		{ opacity: 1, transform: 'scale(1) translate3d(0, 0, 0)' },
	],
	'pulse-soft': [
		{ transform: 'scale(1)', opacity: 1, offset: 0 },
		{ transform: 'scale(1.03)', opacity: 0.92, offset: 0.22 },
		{ transform: 'scale(1)', opacity: 1, offset: 1 },
	],
	'bounce-soft': [
		{ transform: 'translate3d(0, 0, 0)', offset: 0 },
		{ transform: 'translate3d(0, -14px, 0)', offset: 0.2 },
		{ transform: 'translate3d(0, 0, 0)', offset: 1 },
	],
};

let abwLastScrollY = 0;
let abwScrollDirection = 'down';
let abwScrollTrackerAttached = false;
const ABW_GIF_SCRUB_MAX_FRAMES = 240;

function attachScrollDirectionTracker() {
	if (abwScrollTrackerAttached || typeof window === 'undefined') {
		return;
	}
	abwLastScrollY = window.scrollY || window.pageYOffset || 0;
	window.addEventListener('scroll', () => {
		const nextY = window.scrollY || window.pageYOffset || 0;
		abwScrollDirection = nextY >= abwLastScrollY ? 'down' : 'up';
		abwLastScrollY = nextY;
	}, { passive: true });
	abwScrollTrackerAttached = true;
}

function resolveScrollLinkedDirection(direction) {
	if (direction === 'scroll') {
		return abwScrollDirection === 'up' ? 'up' : 'down';
	}
	if (direction === 'scroll-reverse') {
		return abwScrollDirection === 'up' ? 'down' : 'up';
	}
	return direction;
}

function normalizePresetSettings(rawPreset, rawDirection, rawZoomMode) {
	let preset = rawPreset || 'fade';
	let direction = rawDirection || 'up';
	let zoomMode = rawZoomMode || 'in';

	if (preset === 'fade-up') {
		preset = 'fade';
		direction = 'up';
	} else if (preset === 'fade-down') {
		preset = 'fade';
		direction = 'down';
	} else if (preset === 'fade-left') {
		preset = 'fade';
		direction = 'left';
	} else if (preset === 'fade-right') {
		preset = 'fade';
		direction = 'right';
	} else if (preset === 'slide-up') {
		preset = 'slide';
		direction = 'up';
	} else if (preset === 'slide-down') {
		preset = 'slide';
		direction = 'down';
	} else if (preset === 'slide-left') {
		preset = 'slide';
		direction = 'left';
	} else if (preset === 'slide-right') {
		preset = 'slide';
		direction = 'right';
	} else if (preset === 'zoom-in') {
		preset = 'zoom';
		zoomMode = 'in';
	} else if (preset === 'zoom-out') {
		preset = 'zoom';
		zoomMode = 'out';
	} else if (preset === 'flip-y') {
		preset = 'flip';
		if (!rawDirection || rawDirection === 'up' || rawDirection === 'down') {
			direction = 'vertical';
		}
	}

	return { preset, direction, zoomMode };
}

function resolvePresetKeyframes(preset, direction, zoomMode, textGranularity) {
	if (preset === 'fade') {
		if (direction === 'down') {
			return [
				{ opacity: 0, transform: 'translate3d(0, -18px, 0)' },
				{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
			];
		}
		if (direction === 'left') {
			return [
				{ opacity: 0, transform: 'translate3d(18px, 0, 0)' },
				{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
			];
		}
		if (direction === 'right') {
			return [
				{ opacity: 0, transform: 'translate3d(-18px, 0, 0)' },
				{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
			];
		}
		return [
			{ opacity: 0, transform: 'translate3d(0, 18px, 0)' },
			{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
		];
	}

	if (preset === 'slide') {
		if (direction === 'down') {
			return [
				{ opacity: 0, transform: 'translate3d(0, -36px, 0)' },
				{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
			];
		}
		if (direction === 'left') {
			return [
				{ opacity: 0, transform: 'translate3d(24px, 0, 0)' },
				{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
			];
		}
		if (direction === 'right') {
			return [
				{ opacity: 0, transform: 'translate3d(-24px, 0, 0)' },
				{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
			];
		}
		return [
			{ opacity: 0, transform: 'translate3d(0, 36px, 0)' },
			{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
		];
	}

	if (preset === 'text-rise') {
		if (direction === 'down') {
			return [
				{ opacity: 0, transform: 'translate3d(0, -14px, 0)' },
				{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
			];
		}
		return [
			{ opacity: 0, transform: 'translate3d(0, 14px, 0)' },
			{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
		];
	}

	if (preset === 'zoom') {
		return zoomMode === 'out'
			? [
					{ opacity: 0, transform: 'scale(1.08)' },
					{ opacity: 1, transform: 'scale(1)' },
			  ]
			: [
					{ opacity: 0, transform: 'scale(0.92)' },
					{ opacity: 1, transform: 'scale(1)' },
			  ];
	}

	if (preset === 'rotate-in') {
		const start = direction === 'counterclockwise' ? 6 : -6;
		return [
			{ opacity: 0, transform: `rotate(${start}deg) scale(0.98)` },
			{ opacity: 1, transform: 'rotate(0deg) scale(1)' },
		];
	}

	if (preset === 'flip') {
		const axis = direction === 'horizontal' ? 'X' : 'Y';
		const angle = direction === 'right' ? 18 : -18;
		return [
			{ opacity: 0, transform: `perspective(600px) rotate${axis}(${angle}deg)` },
			{ opacity: 1, transform: `perspective(600px) rotate${axis}(0deg)` },
		];
	}

	if (preset === 'float-soft') {
		if (direction === 'down') {
			return [
				{ transform: 'translate3d(0, 0, 0)', offset: 0 },
				{ transform: 'translate3d(0, 8px, 0)', offset: 0.2 },
				{ transform: 'translate3d(0, 0, 0)', offset: 1 },
			];
		}
		if (direction === 'left') {
			return [
				{ transform: 'translate3d(0, 0, 0)', offset: 0 },
				{ transform: 'translate3d(-8px, 0, 0)', offset: 0.2 },
				{ transform: 'translate3d(0, 0, 0)', offset: 1 },
			];
		}
		if (direction === 'right') {
			return [
				{ transform: 'translate3d(0, 0, 0)', offset: 0 },
				{ transform: 'translate3d(8px, 0, 0)', offset: 0.2 },
				{ transform: 'translate3d(0, 0, 0)', offset: 1 },
			];
		}
		return [
			{ transform: 'translate3d(0, 0, 0)', offset: 0 },
			{ transform: 'translate3d(0, -8px, 0)', offset: 0.2 },
			{ transform: 'translate3d(0, 0, 0)', offset: 1 },
		];
	}

	if (preset === 'pulse-soft' && textGranularity === 'character') {
		return [
			{ transform: 'scale(1) translate3d(0, 0, 0)', opacity: 1, offset: 0 },
			{ transform: 'scale(1.12) translate3d(0, -2px, 0)', opacity: 0.78, offset: 0.2 },
			{ transform: 'scale(1) translate3d(0, 0, 0)', opacity: 1, offset: 1 },
		];
	}

	return PRESET_KEYFRAMES[preset] || [
		{ opacity: 0, transform: 'translate3d(0, 18px, 0)' },
		{ opacity: 1, transform: 'translate3d(0, 0, 0)' },
	];
}

const TEXT_SPLIT_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption';

function applyInitialState(target, keyframes) {
	if (!Array.isArray(keyframes) || keyframes.length < 1) {
		return;
	}
	const from = keyframes[0];
	Object.keys(from).forEach((property) => {
		target.style[property] = from[property];
	});
}

function clearInlineState(target) {
	target.style.opacity = '';
	target.style.transform = '';
	target.style.filter = '';
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function parseNumericToken(token) {
	const match = String(token).trim().match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
	if (!match) {
		return null;
	}
	return {
		value: Number(match[1]),
		unit: match[2] || '',
	};
}

function scaleLinearToken(token, factor) {
	const parsed = parseNumericToken(token);
	if (!parsed) {
		return token;
	}
	return `${parsed.value * factor}${parsed.unit}`;
}

function scaleScaleToken(token, factor) {
	const parsed = parseNumericToken(token);
	if (!parsed) {
		return token;
	}
	return `${1 + (parsed.value - 1) * factor}${parsed.unit}`;
}

function scaleTransformIntensity(transform, factor) {
	if (!transform) {
		return transform;
	}

	return String(transform)
		.replace(/translate3d\(([^,]+),([^,]+),([^)]+)\)/g, (_m, x, y, z) =>
			`translate3d(${scaleLinearToken(x, factor)}, ${scaleLinearToken(y, factor)}, ${scaleLinearToken(z, factor)})`
		)
		.replace(/translateX\(([^)]+)\)/g, (_m, x) => `translateX(${scaleLinearToken(x, factor)})`)
		.replace(/translateY\(([^)]+)\)/g, (_m, y) => `translateY(${scaleLinearToken(y, factor)})`)
		.replace(/translateZ\(([^)]+)\)/g, (_m, z) => `translateZ(${scaleLinearToken(z, factor)})`)
		.replace(/scale\(([^)]+)\)/g, (_m, s) => `scale(${scaleScaleToken(s, factor)})`)
		.replace(/rotate(?:X|Y|Z)?\(([^)]+)\)/g, (m, v) => {
			const fn = m.slice(0, m.indexOf('('));
			return `${fn}(${scaleLinearToken(v, factor)})`;
		});
}

function scaleFilterIntensity(filter, factor) {
	if (!filter) {
		return filter;
	}
	return String(filter).replace(/blur\(([-\d.]+)px\)/g, (_m, value) => {
		return `blur(${Number(value) * factor}px)`;
	});
}

function scaleOpacityIntensity(opacity, factor) {
	const numeric = Number(opacity);
	if (Number.isNaN(numeric)) {
		return opacity;
	}
	return clamp(1 - (1 - numeric) * factor, 0, 1);
}

function applyIntensityToKeyframes(keyframes, intensityPercent) {
	const factor = clamp((Number(intensityPercent || 100) / 100) * 1.5, 0.15, 3);
	return keyframes.map((frame) => {
		const nextFrame = { ...frame };
		if (nextFrame.transform) {
			nextFrame.transform = scaleTransformIntensity(nextFrame.transform, factor);
		}
		if (nextFrame.filter) {
			nextFrame.filter = scaleFilterIntensity(nextFrame.filter, factor);
		}
		if (nextFrame.opacity !== undefined) {
			nextFrame.opacity = scaleOpacityIntensity(nextFrame.opacity, factor);
		}
		return nextFrame;
	});
}

function keyframesStartHidden(keyframes) {
	if (!Array.isArray(keyframes) || keyframes.length < 1) {
		return false;
	}
	const firstOpacity = keyframes[0].opacity;
	if (firstOpacity === undefined) {
		return false;
	}
	const numericOpacity = Number(firstOpacity);
	return !Number.isNaN(numericOpacity) && numericOpacity < 1;
}

function tokenizeText(text, mode) {
	if (mode === 'character') {
		return Array.from(text).map((char) =>
			/\s/.test(char)
				? { type: 'space', value: char }
				: { type: 'unit', value: char }
		);
	}

	return text.split(/(\s+)/).map((token) =>
		/^\s+$/.test(token)
			? { type: 'space', value: token }
			: { type: 'unit', value: token }
	);
}

function ensureSplitRoot(element, mode) {
	if (!element.dataset.abwOriginalHtml) {
		element.dataset.abwOriginalHtml = element.innerHTML;
	}

	if (element.dataset.abwSplitMode !== mode) {
		element.innerHTML = element.dataset.abwOriginalHtml;
	}

	if (mode !== 'character') {
		element.classList.remove('abw-text-character-mode');
	}
}

function collectSplitTextNodes(element, owningWrapper) {
	const textNodes = [];

	const walker = document.createTreeWalker(
		element,
		NodeFilter.SHOW_TEXT,
		{
			acceptNode(node) {
				if (!node.nodeValue || !node.nodeValue.trim()) {
					return NodeFilter.FILTER_REJECT;
				}
				const parent = node.parentElement;
				if (!parent) {
					return NodeFilter.FILTER_REJECT;
				}
				if (parent.closest('.abw-text-unit')) {
					return NodeFilter.FILTER_REJECT;
				}
				if (parent.closest('script,style,noscript')) {
					return NodeFilter.FILTER_REJECT;
				}
				const closestWrapper = parent.closest('.wp-block-animation-block-wrapper-wrapper.abw-wrapper');
				if (closestWrapper && closestWrapper !== owningWrapper) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			},
		}
	);

	let current;
	while ((current = walker.nextNode())) {
		textNodes.push(current);
	}

	return textNodes;
}

function splitElementTextUnits(element, mode, owningWrapper) {
	ensureSplitRoot(element, mode);

	if (element.dataset.abwSplitMode === mode && element.querySelector('.abw-text-unit')) {
		return;
	}

	const textNodes = collectSplitTextNodes(element, owningWrapper);

	textNodes.forEach((textNode) => {
		const fragment = document.createDocumentFragment();
		const tokens = tokenizeText(textNode.nodeValue || '', mode);

		tokens.forEach((token) => {
			if (token.type === 'space') {
				fragment.appendChild(document.createTextNode(token.value));
				return;
			}
			if (token.type === 'break') {
				fragment.appendChild(document.createElement('br'));
				return;
			}
			if (!token.value) {
				return;
			}

			const span = document.createElement('span');
			span.className = 'abw-text-unit';
			span.textContent = token.value;
			fragment.appendChild(span);
		});

		if (textNode.parentNode) {
			textNode.parentNode.replaceChild(fragment, textNode);
		}
	});

	element.dataset.abwSplitMode = mode;
}

function splitElementTextCharacters(element, owningWrapper) {
	ensureSplitRoot(element, 'character');
	element.classList.add('abw-text-character-mode');

	if (element.dataset.abwSplitMode === 'character' && element.querySelector('.abw-text-unit-char')) {
		return;
	}

	const textNodes = collectSplitTextNodes(element, owningWrapper);

	textNodes.forEach((textNode) => {
		const fragment = document.createDocumentFragment();
		const parts = (textNode.nodeValue || '').split(/(\s+)/);

		parts.forEach((part) => {
			if (!part) {
				return;
			}
			if (/^\s+$/.test(part)) {
				fragment.appendChild(document.createTextNode(part));
				return;
			}

			const word = document.createElement('span');
			word.className = 'abw-text-word';

			Array.from(part).forEach((char) => {
				const span = document.createElement('span');
				span.className = 'abw-text-unit abw-text-unit-char';
				span.textContent = char;
				word.appendChild(span);
			});

			fragment.appendChild(word);
		});

		if (textNode.parentNode) {
			textNode.parentNode.replaceChild(fragment, textNode);
		}
	});

	element.dataset.abwSplitMode = 'character';
}

function splitElementTextLines(element, owningWrapper) {
	ensureSplitRoot(element, 'line');

	if (element.dataset.abwSplitMode === 'line' && element.querySelector('.abw-text-unit-line')) {
		return;
	}

	// First pass: split into measurable word units.
	splitElementTextUnits(element, 'word', owningWrapper);

	const units = Array.from(element.querySelectorAll('.abw-text-unit'));
	if (!units.length) {
		element.dataset.abwSplitMode = 'line';
		return;
	}

	let lineIndex = -1;
	let lastTop = null;
	const lineMap = new Map();

	units.forEach((unit, index) => {
		const top = Math.round(unit.getBoundingClientRect().top);
		if (lastTop === null || Math.abs(top - lastTop) > 2) {
			lineIndex += 1;
			lastTop = top;
		}
		lineMap.set(index, lineIndex);
	});

	const lineWords = [];
	units.forEach((unit, index) => {
		const measuredLine = lineMap.get(index) ?? 0;
		if (!lineWords[measuredLine]) {
			lineWords[measuredLine] = [];
		}
		lineWords[measuredLine].push(unit.textContent || '');
	});

	const fragment = document.createDocumentFragment();
	lineWords.forEach((words) => {
		const lineText = words.join(' ').trim();
		if (!lineText || !lineText.trim()) {
			return;
		}
		const line = document.createElement('span');
		line.className = 'abw-text-unit abw-text-unit-line';
		line.textContent = lineText;
		fragment.appendChild(line);
	});

	element.innerHTML = '';
	element.appendChild(fragment);
	element.dataset.abwSplitMode = 'line';
}

function resolveTextStagger(stagger, textGranularity) {
	if (stagger > 0) {
		return stagger;
	}
	if (textGranularity === 'character') {
		return 22;
	}
	if (textGranularity === 'line') {
		return 120;
	}
	return 55;
}

function restoreTextSplits(wrapper) {
	const splitRoots = wrapper.querySelectorAll('[data-abw-original-html]');
	splitRoots.forEach((element) => {
		element.innerHTML = element.dataset.abwOriginalHtml || element.innerHTML;
		delete element.dataset.abwSplitMode;
		element.classList.remove('abw-text-character-mode');
	});
}

function scheduleTextRestore(wrapper, duration, delay, stagger, targetCount, shouldLoop) {
	if (shouldLoop || wrapper.dataset.ffawContentKind !== 'text') {
		return;
	}

	const existingTimer = Number(wrapper.dataset.abwRestoreTimer || 0);
	if (existingTimer) {
		window.clearTimeout(existingTimer);
	}

	const totalDelay = delay + Math.max(0, targetCount - 1) * stagger + duration + 40;
	const timer = window.setTimeout(() => {
		restoreTextSplits(wrapper);
		wrapper.dataset.abwRestoreTimer = '';
	}, totalDelay);

	wrapper.dataset.abwRestoreTimer = String(timer);
}

function getParentFollowWrapperTargets(wrapper) {
	return Array.from(wrapper.children).filter((child) => {
		if (child.nodeType !== 1) {
			return false;
		}
		if (!child.classList.contains('abw-wrapper')) {
			return false;
		}
		return child.dataset.ffawFollowParentAnimation === '1';
	});
}

function mergeFollowTargets(wrapper, targets) {
	const merged = Array.isArray(targets) ? [...targets] : [];
	const followTargets = getParentFollowWrapperTargets(wrapper);
	followTargets.forEach((target) => {
		if (!merged.includes(target)) {
			merged.push(target);
		}
	});
	return merged;
}

function getAnimationTargets(wrapper, preset, textGranularity) {
	const mode = ['word', 'character', 'line'].includes(textGranularity) ? textGranularity : 'word';
	const candidates = Array.from(wrapper.querySelectorAll(TEXT_SPLIT_SELECTOR)).filter((element) => {
		const closestWrapper = element.closest('.wp-block-animation-block-wrapper-wrapper.abw-wrapper');
		return closestWrapper === wrapper;
	});
	const isTextContent = wrapper.dataset.ffawContentKind === 'text';
	const shouldTreatAsText = isTextContent;

	if (shouldTreatAsText) {
		candidates.forEach((element) => {
			if (mode === 'line') {
				splitElementTextLines(element, wrapper);
			} else if (mode === 'character') {
				splitElementTextCharacters(element, wrapper);
			} else {
				splitElementTextUnits(element, mode, wrapper);
			}
		});
		const textUnits = mode === 'line'
			? Array.from(wrapper.querySelectorAll('.abw-text-unit-line')).filter((unit) => {
				const closestWrapper = unit.closest('.wp-block-animation-block-wrapper-wrapper.abw-wrapper');
				return closestWrapper === wrapper;
			})
			: Array.from(wrapper.querySelectorAll('.abw-text-unit')).filter((unit) => {
				const closestWrapper = unit.closest('.wp-block-animation-block-wrapper-wrapper.abw-wrapper');
				return closestWrapper === wrapper;
			});
		if (textUnits.length) {
			return textUnits;
		}
	}

	restoreTextSplits(wrapper);
	const childTargets = Array.from(wrapper.children).filter((child) => child.nodeType === 1);
	const nonNestedWrapperTargets = childTargets.filter((child) => {
		if (child.classList.contains('abw-wrapper')) {
			return child.dataset.ffawFollowParentAnimation === '1';
		}
		// If this target contains any nested AniLibrary wrapper, let nested wrappers control their own lifecycle.
		if (child.querySelector('.abw-wrapper')) {
			return false;
		}
		return true;
	});
	return nonNestedWrapperTargets;
}

function animateTargets(targets, keyframes, options, reverse) {
	const isReverse = !!reverse;
	const frames = isReverse ? [...keyframes].reverse() : keyframes;
	const animations = [];
	targets.forEach((target, index) => {
		if (!isReverse) {
			clearInlineState(target);
		}
		const animation = target.animate(frames, {
			duration: options.duration,
			delay: options.delay + index * options.stagger,
			easing: options.easing,
			iterations: options.iterations,
			fill: options.fill,
		});
		animations.push(animation);
	});
	return animations;
}

function cancelWrapperAnimations(wrapper) {
	const runningAnimations = Array.isArray(wrapper.abwAnimations)
		? wrapper.abwAnimations
		: [];
	runningAnimations.forEach((animation) => {
		try {
			animation.cancel();
		} catch (_error) {
			// Ignore cancel failures from already-finished animations.
		}
	});
	wrapper.abwAnimations = [];
}

function resolveInheritedDelay(wrapper, ownDelay, visited = new Set()) {
	const baseDelay = Math.max(0, ownDelay);
	const shouldInheritParentDelay = wrapper.dataset.ffawInheritParentDelay === '1';
	if (!shouldInheritParentDelay) {
		return baseDelay;
	}

	if (visited.has(wrapper)) {
		return baseDelay;
	}
	visited.add(wrapper);

	const parentWrapper = wrapper.parentElement
		? wrapper.parentElement.closest('.wp-block-animation-block-wrapper-wrapper.abw-wrapper')
		: null;

	if (!parentWrapper) {
		return baseDelay;
	}

	const parentOwnDelay = Number(parentWrapper.dataset.ffawDelay || 0);
	const inheritedParentDelay = resolveInheritedDelay(
		parentWrapper,
		parentOwnDelay,
		visited
	);

	return baseDelay + inheritedParentDelay;
}

function resolveWrapperAnimationState(wrapper, directionOverride) {
	const rawPreset = wrapper.dataset.ffawPreset || 'fade';
	const selectedDirection = directionOverride || wrapper.dataset.ffawDirection || 'up';
	const zoomMode = wrapper.dataset.ffawZoomMode || 'in';
	const normalized = normalizePresetSettings(rawPreset, selectedDirection, zoomMode);
	const textGranularity = wrapper.dataset.ffawTextGranularity || 'word';
	const intensity = Number(wrapper.dataset.ffawIntensity || 100);
	const keyframes = applyIntensityToKeyframes(
		resolvePresetKeyframes(
			normalized.preset,
			normalized.direction,
			normalized.zoomMode,
			textGranularity
		),
		intensity
	);

	return {
		preset: normalized.preset,
		textGranularity,
		keyframes,
	};
}

function animateChildren(wrapper, reverse = false, config = {}) {
	const animationState = resolveWrapperAnimationState(wrapper, config.directionOverride);
	const { preset, textGranularity, keyframes } = animationState;
	const shouldLoop =
		wrapper.dataset.ffawLoop === '1' || wrapper.dataset.ffawTrigger === 'loop';
	let targets = getAnimationTargets(wrapper, preset, textGranularity);
	targets = mergeFollowTargets(wrapper, targets);
	const rawStagger = Number(wrapper.dataset.ffawStagger || 0);
	const bounceCount = Math.max(1, Math.min(8, Number(wrapper.dataset.ffawBounceCount || 1)));
	const isTextContent = wrapper.dataset.ffawContentKind === 'text';
	const forceSingleIteration = !!config.forceSingleIteration;
	let effectiveStagger = isTextContent
		? resolveTextStagger(rawStagger, textGranularity)
		: 0;
	if (shouldLoop && isTextContent && textGranularity === 'character' && targets.length > 1) {
		// Keep character loops snappy by capping total stagger window.
		const maxCascadeMs = 900;
		const cappedStep = Math.max(4, Math.floor(maxCascadeMs / (targets.length - 1)));
		effectiveStagger = Math.min(effectiveStagger, cappedStep);
	}
	const duration = Number(wrapper.dataset.ffawDuration || 700);
	const configuredDelay = Number(wrapper.dataset.ffawDelay || 0);
	const hasCustomStartDelay = Number.isFinite(config.startDelay);
	const delay = hasCustomStartDelay
		? Math.max(0, Number(config.startDelay))
		: resolveInheritedDelay(wrapper, configuredDelay);
	const iterations = shouldLoop && !forceSingleIteration
		? Infinity
		: preset === 'bounce-soft'
			? bounceCount
			: 1;
	const fillMode = shouldLoop
		? delay > 0
			? 'backwards'
			: 'none'
		: delay > 0
			? 'both'
			: 'forwards';

	cancelWrapperAnimations(wrapper);
	const animations = animateTargets(
		targets,
		keyframes,
		{
			duration,
			delay,
			stagger: effectiveStagger,
			easing: wrapper.dataset.ffawEasing || 'ease-out',
			iterations,
			fill: fillMode,
			textGranularity,
		},
		reverse
	);
	wrapper.abwAnimations = animations;

	if (isTextContent && !reverse) {
		scheduleTextRestore(wrapper, duration, delay, effectiveStagger, targets.length, shouldLoop);
	}

	if (typeof config.onComplete === 'function' && iterations !== Infinity && animations.length) {
		Promise.allSettled(
			animations.map((animation) =>
				animation.finished.catch(() => undefined)
			)
		).then(() => {
			config.onComplete();
		});
	}
}

function isWrapperInViewport(wrapper, threshold) {
	const rect = wrapper.getBoundingClientRect();
	const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
	const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
	if (viewportWidth <= 0 || viewportHeight <= 0) {
		return false;
	}

	const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
	const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
	if (visibleWidth <= 0 || visibleHeight <= 0) {
		return false;
	}

	const area = rect.width * rect.height;
	if (area <= 0) {
		return false;
	}

	const visibleRatio = (visibleWidth * visibleHeight) / area;
	const clampedThreshold = clamp(Number(threshold) || 0, 0, 1);
	return visibleRatio >= clampedThreshold;
}

function collectScrollMediaTargets(wrapper) {
	const candidates = Array.from(wrapper.querySelectorAll('video,img')).filter((element) => {
		const closestWrapper = element.closest('.wp-block-animation-block-wrapper-wrapper.abw-wrapper');
		return closestWrapper === wrapper;
	});

	return candidates.filter((element) => {
		if (element.tagName.toLowerCase() === 'video') {
			return true;
		}
		const src = element.currentSrc || element.src || '';
		return /\.gif(?:[?#].*)?$/i.test(src);
	});
}

function getDocumentScrollProgress() {
	const scrollTop = window.scrollY || window.pageYOffset || 0;
	const scrollHeight = Math.max(
		document.body ? document.body.scrollHeight : 0,
		document.documentElement ? document.documentElement.scrollHeight : 0
	);
	const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
	const maxScroll = Math.max(1, scrollHeight - viewportHeight);
	return clamp(scrollTop / maxScroll, 0, 1);
}

function getMappedPercentProgress(valuePercent, startPercent, endPercent) {
	const start = clamp(Number(startPercent) || 0, 0, 100) / 100;
	const end = clamp(Number(endPercent) || 0, 0, 100) / 100;
	if (Math.abs(start - end) < 0.001) {
		return valuePercent >= end ? 1 : 0;
	}
	return clamp((valuePercent - start) / (end - start), 0, 1);
}

function getMediaScrollMeasurementRect(wrapper, target) {
	const canvas = target && target.abwGifScrubCanvas;
	const element = canvas && document.body.contains(canvas)
		? canvas
		: target || wrapper;
	return element.getBoundingClientRect();
}

function getViewportMediaScrollProgress(wrapper, target) {
	const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
	if (viewportHeight <= 0) {
		return 0;
	}
	const start = (clamp(Number(wrapper.dataset.ffawMediaScrollViewportStart) || 0, 0, 100) / 100) * viewportHeight;
	const end = (clamp(Number(wrapper.dataset.ffawMediaScrollViewportEnd) || 0, 0, 100) / 100) * viewportHeight;
	const rect = getMediaScrollMeasurementRect(wrapper, target);
	const edge = wrapper.dataset.ffawMediaScrollViewportEdge === 'bottom'
		? rect.bottom
		: rect.top;
	if (wrapper.dataset.ffawMediaScrollStartAtPageTop === '1') {
		const scrollTop = window.scrollY || window.pageYOffset || 0;
		const travelDistance = Math.max(1, end);
		return clamp(scrollTop / travelDistance, 0, 1);
	}
	const lowerScreenPosition = Math.max(start, end);
	const upperScreenPosition = Math.min(start, end);
	if (Math.abs(lowerScreenPosition - upperScreenPosition) < 1) {
		return edge <= upperScreenPosition ? 1 : 0;
	}
	return clamp((lowerScreenPosition - edge) / (lowerScreenPosition - upperScreenPosition), 0, 1);
}

function getParentMediaScrollProgress(wrapper, startAtPageTop) {
	const parent = wrapper.parentElement;
	if (!parent) {
		return getDocumentScrollProgress();
	}

	const maxParentScroll = Math.max(0, parent.scrollHeight - parent.clientHeight);
	if (maxParentScroll > 1) {
		return clamp(parent.scrollTop / maxParentScroll, 0, 1);
	}

	const rect = parent.getBoundingClientRect();
	const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
	if (startAtPageTop) {
		const scrollTop = window.scrollY || window.pageYOffset || 0;
		const parentPageTop = rect.top + scrollTop;
		const localScroll = parentPageTop <= viewportHeight
			? scrollTop
			: Math.max(0, scrollTop - (parentPageTop - viewportHeight));
		const travel = Math.max(1, rect.height || parent.offsetHeight || viewportHeight);
		return clamp(localScroll / travel, 0, 1);
	}

	const travel = Math.max(1, viewportHeight + rect.height);
	return clamp((viewportHeight - rect.top) / travel, 0, 1);
}

function getMediaScrollProgress(wrapper, target) {
	const source = wrapper.dataset.ffawMediaScrollProgressSource || 'viewport';
	if (source === 'document') {
		if (wrapper.dataset.ffawMediaScrollStartAtPageTop === '1') {
			return getMappedPercentProgress(
				getDocumentScrollProgress(),
				0,
				wrapper.dataset.ffawMediaScrollDocumentEnd
			);
		}
		return getMappedPercentProgress(
			getDocumentScrollProgress(),
			wrapper.dataset.ffawMediaScrollDocumentStart,
			wrapper.dataset.ffawMediaScrollDocumentEnd
		);
	}
	if (source === 'parent') {
		if (wrapper.dataset.ffawMediaScrollStartAtPageTop === '1') {
			return getMappedPercentProgress(
				getParentMediaScrollProgress(wrapper, true),
				0,
				wrapper.dataset.ffawMediaScrollDocumentEnd
			);
		}
		return getMappedPercentProgress(
			getParentMediaScrollProgress(wrapper, false),
			wrapper.dataset.ffawMediaScrollDocumentStart,
			wrapper.dataset.ffawMediaScrollDocumentEnd
		);
	}
	return getViewportMediaScrollProgress(wrapper, target);
}

function setVideoScrollProgress(video, progress) {
	const applyProgress = () => {
		const duration = Number(video.duration);
		if (!Number.isFinite(duration) || duration <= 0) {
			return;
		}
		const safeDuration = Math.max(0, duration - 0.05);
		try {
			video.pause();
			video.currentTime = clamp(progress, 0, 1) * safeDuration;
		} catch (_error) {
			// Some browsers reject currentTime writes before media metadata is ready.
		}
	};

	video.preload = video.preload || 'metadata';
	video.playsInline = true;

	if (Number.isFinite(Number(video.duration)) && Number(video.duration) > 0) {
		applyProgress();
		return;
	}

	video.dataset.abwPendingScrollProgress = String(clamp(progress, 0, 1));
	if (!video.dataset.abwMetadataListenerAttached) {
		video.dataset.abwMetadataListenerAttached = '1';
		video.addEventListener('loadedmetadata', () => {
			const pendingProgress = Number(video.dataset.abwPendingScrollProgress || 0);
			setVideoScrollProgress(video, pendingProgress);
			delete video.dataset.abwMetadataListenerAttached;
		}, { once: true });
	}
	try {
		video.load();
	} catch (_error) {
		// Ignore load failures; the next metadata event will retry if available.
	}
}

function skipGifSubBlocks(bytes, offset) {
	let cursor = offset;
	while (cursor < bytes.length) {
		const blockSize = bytes[cursor];
		cursor += 1;
		if (blockSize === 0) {
			break;
		}
		cursor += blockSize;
	}
	return cursor;
}

function parseGifFrameMetadata(buffer) {
	const bytes = new Uint8Array(buffer);
	if (bytes.length < 13) {
		return null;
	}

	const signature = String.fromCharCode(...bytes.slice(0, 6));
	if (signature !== 'GIF87a' && signature !== 'GIF89a') {
		return null;
	}

	const width = bytes[6] | (bytes[7] << 8);
	const height = bytes[8] | (bytes[9] << 8);
	const packed = bytes[10];
	let offset = 13;
	if (packed & 0x80) {
		offset += 3 * (1 << ((packed & 0x07) + 1));
	}

	const delays = [];
	let pendingDelay = 100;

	while (offset < bytes.length) {
		const introducer = bytes[offset];
		offset += 1;

		if (introducer === 0x3b) {
			break;
		}

		if (introducer === 0x21) {
			const label = bytes[offset];
			offset += 1;
			if (label === 0xf9 && bytes[offset] === 4) {
				const delayHundredths = bytes[offset + 2] | (bytes[offset + 3] << 8);
				pendingDelay = delayHundredths > 0
					? Math.max(delayHundredths * 10, 20)
					: 100;
				offset += 6;
				continue;
			}
			offset = skipGifSubBlocks(bytes, offset);
			continue;
		}

		if (introducer === 0x2c) {
			if (offset + 9 >= bytes.length) {
				break;
			}
			const imagePacked = bytes[offset + 8];
			offset += 9;
			if (imagePacked & 0x80) {
				offset += 3 * (1 << ((imagePacked & 0x07) + 1));
			}
			offset += 1;
			offset = skipGifSubBlocks(bytes, offset);
			delays.push(pendingDelay);
			pendingDelay = 100;
			continue;
		}

		break;
	}

	if (!delays.length || width <= 0 || height <= 0) {
		return null;
	}

	let duration = delays.reduce((total, delay) => total + delay, 0);
	if (!Number.isFinite(duration) || duration <= 0) {
		duration = delays.length * 100;
	}

	const cumulative = [];
	let elapsed = 0;
	delays.forEach((delay) => {
		elapsed += delay;
		cumulative.push(elapsed);
	});

	return {
		width,
		height,
		delays,
		cumulative,
		duration,
		frameCount: delays.length,
	};
}

function getGifFrameIndex(scrubber, progress) {
	const clampedProgress = clamp(progress, 0, 1);
	const targetTime = clampedProgress * scrubber.duration;
	const cumulative = scrubber.cumulative;
	for (let index = 0; index < cumulative.length; index += 1) {
		if (targetTime <= cumulative[index]) {
			return Math.min(index, scrubber.frames.length - 1);
		}
	}
	return scrubber.frames.length - 1;
}

function drawGifScrubberFrame(scrubber, progress) {
	const frameIndex = getGifFrameIndex(scrubber, progress);
	if (frameIndex === scrubber.currentFrameIndex) {
		return;
	}
	const frame = scrubber.frames[frameIndex];
	if (!frame) {
		return;
	}
	scrubber.context.clearRect(0, 0, scrubber.canvas.width, scrubber.canvas.height);
	scrubber.context.drawImage(frame, 0, 0);
	scrubber.currentFrameIndex = frameIndex;
}

async function decodeGifFrameBitmaps(buffer, metadata) {
	if (!('ImageDecoder' in window) || typeof createImageBitmap !== 'function') {
		throw new Error('ImageDecoder unavailable');
	}
	if (metadata.frameCount > ABW_GIF_SCRUB_MAX_FRAMES) {
		throw new Error('GIF frame cap exceeded');
	}

	const decoder = new window.ImageDecoder({
		data: buffer.slice(0),
		type: 'image/gif',
	});

	const frames = [];
	try {
		if (decoder.tracks?.ready) {
			await decoder.tracks.ready;
		}

		for (let frameIndex = 0; frameIndex < metadata.frameCount; frameIndex += 1) {
			const result = await decoder.decode({ frameIndex });
			let bitmap;
			try {
				bitmap = await createImageBitmap(result.image);
			} finally {
				if (typeof result.image.close === 'function') {
					result.image.close();
				}
			}
			frames.push(bitmap);
		}
	} catch (error) {
		frames.forEach((frame) => {
			if (typeof frame.close === 'function') {
				frame.close();
			}
		});
		throw error;
	} finally {
		if (typeof decoder.close === 'function') {
			decoder.close();
		}
	}

	return frames;
}

function createGifScrubCanvas(image, metadata) {
	const renderedRect = image.getBoundingClientRect();
	const renderedWidth = renderedRect.width;
	const renderedHeight = renderedRect.height;
	const imageStyles = window.getComputedStyle(image);
	const alignedAncestor = image.closest('.aligncenter,.alignleft,.alignright,.has-text-align-center');
	const canvas = document.createElement('canvas');
	canvas.width = metadata.width;
	canvas.height = metadata.height;
	canvas.className = `${image.className || ''} abw-gif-scrub-canvas`.trim();
	if (alignedAncestor) {
		if (alignedAncestor.classList.contains('aligncenter') || alignedAncestor.classList.contains('has-text-align-center')) {
			canvas.classList.add('abw-gif-scrub-align-center');
		}
		if (alignedAncestor.classList.contains('alignleft')) {
			canvas.classList.add('abw-gif-scrub-align-left');
		}
		if (alignedAncestor.classList.contains('alignright')) {
			canvas.classList.add('abw-gif-scrub-align-right');
		}
	}
	canvas.style.cssText = image.style.cssText;
	if (renderedWidth > 0 && !canvas.style.width) {
		canvas.style.width = `${renderedWidth}px`;
	}
	if (renderedHeight > 0 && !canvas.style.height) {
		canvas.style.height = `${renderedHeight}px`;
	}
	if (!canvas.style.marginLeft && imageStyles.marginLeft && imageStyles.marginLeft !== '0px') {
		canvas.style.marginLeft = imageStyles.marginLeft;
	}
	if (!canvas.style.marginRight && imageStyles.marginRight && imageStyles.marginRight !== '0px') {
		canvas.style.marginRight = imageStyles.marginRight;
	}
	canvas.setAttribute('role', 'img');
	const alt = image.getAttribute('alt');
	if (alt) {
		canvas.setAttribute('aria-label', alt);
	}

	image.classList.add('abw-gif-scrub-source');
	image.insertAdjacentElement('afterend', canvas);
	image.abwGifScrubCanvas = canvas;

	return canvas;
}

async function prepareGifScrubber(image) {
	const src = image.currentSrc || image.src || '';
	if (!src) {
		throw new Error('GIF source unavailable');
	}

	const response = await fetch(src, { credentials: 'same-origin' });
	if (!response.ok) {
		throw new Error('GIF fetch failed');
	}

	const buffer = await response.arrayBuffer();
	const metadata = parseGifFrameMetadata(buffer);
	if (!metadata || metadata.frameCount < 2) {
		throw new Error('Animated GIF metadata unavailable');
	}

	image.dataset.abwGifDuration = String(metadata.duration);
	image.dataset.abwGifFrameCount = String(metadata.frameCount);

	const frames = await decodeGifFrameBitmaps(buffer, metadata);
	const canvas = createGifScrubCanvas(image, metadata);
	const context = canvas.getContext('2d');
	if (!context) {
		canvas.remove();
		delete image.abwGifScrubCanvas;
		image.classList.remove('abw-gif-scrub-source');
		throw new Error('Canvas context unavailable');
	}

	return {
		canvas,
		context,
		frames,
		cumulative: metadata.cumulative,
		duration: metadata.duration,
		currentFrameIndex: -1,
	};
}

function ensureGifScrubber(image) {
	if (image.abwGifScrubber || image.dataset.abwGifScrubStatus) {
		return;
	}

	image.dataset.abwGifScrubStatus = 'loading';
	prepareGifScrubber(image)
		.then((scrubber) => {
			image.abwGifScrubber = scrubber;
			image.dataset.abwGifScrubStatus = 'ready';
			const pendingProgress = Number(image.dataset.abwPendingGifProgress || 0);
			drawGifScrubberFrame(scrubber, pendingProgress);
		})
		.catch(() => {
			image.dataset.abwGifScrubStatus = 'fallback';
		});
}

function setGifScrollProgress(image, progress) {
	const clampedProgress = clamp(progress, 0, 1);
	image.classList.add('abw-scroll-media-gif');
	image.style.setProperty('--abw-media-scroll-progress', String(clampedProgress));
	image.dataset.abwMediaScrollProgress = String(Math.round(clampedProgress * 100));
	image.dataset.abwPendingGifProgress = String(clampedProgress);

	if (image.abwGifScrubber) {
		drawGifScrubberFrame(image.abwGifScrubber, clampedProgress);
		return;
	}

	ensureGifScrubber(image);
}

function setScrollMediaProgress(targets, progress) {
	targets.forEach((target) => {
		if (target.tagName.toLowerCase() === 'video') {
			setVideoScrollProgress(target, progress);
			return;
		}
		setGifScrollProgress(target, progress);
	});
}

function applyMediaScrollCycles(progress, cycles) {
	const clampedProgress = clamp(progress, 0, 1);
	const cycleCount = Math.max(1, Math.min(10, Math.round(Number(cycles) || 1)));
	if (cycleCount <= 1) {
		return clampedProgress;
	}
	if (clampedProgress >= 0.999) {
		return 1;
	}
	return (clampedProgress * cycleCount) % 1;
}

function setupScrollMediaControl(wrapper) {
	const targets = collectScrollMediaTargets(wrapper);
	if (!targets.length) {
		return false;
	}

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reduceMotion) {
		wrapper.classList.add('abw-motion-reduced');
		return true;
	}

	attachScrollDirectionTracker();
	wrapper.classList.add('abw-scroll-media-wrapper');
	targets.forEach((target) => {
		if (target.tagName.toLowerCase() === 'video') {
			target.pause();
			target.preload = target.preload || 'metadata';
			target.playsInline = true;
		}
	});

	const playbackDirection = wrapper.dataset.ffawMediaScrollPlaybackDirection === 'backward'
		? 'backward'
		: 'forward';
	const directionLimit = wrapper.dataset.ffawMediaScrollDirectionLimit || 'both';
	const playbackCycles = wrapper.dataset.ffawMediaScrollPlaybackCycles || 1;
	const once = wrapper.dataset.ffawOnce === '1';
	let rafId = 0;
	let lastRawProgress = null;
	let hasMoved = false;
	let locked = false;

	const update = () => {
		rafId = 0;
		if (!document.body.contains(wrapper) || locked) {
			return;
		}

		const rawProgress = getMediaScrollProgress(wrapper, targets[0]);
		if (lastRawProgress !== null) {
			const progressDelta = rawProgress - lastRawProgress;
			if (directionLimit === 'down' && progressDelta < 0) {
				return;
			}
			if (directionLimit === 'up' && progressDelta > 0) {
				return;
			}
			if (Math.abs(progressDelta) > 0.001) {
				hasMoved = true;
			}
		}

		lastRawProgress = rawProgress;
		const playbackProgress = playbackDirection === 'backward'
			? 1 - rawProgress
			: rawProgress;
		setScrollMediaProgress(targets, applyMediaScrollCycles(playbackProgress, playbackCycles));

		if (once && hasMoved && (rawProgress >= 0.999 || rawProgress <= 0.001)) {
			locked = true;
			detach();
		}
	};

	const scheduleUpdate = () => {
		if (rafId || locked) {
			return;
		}
		rafId = window.requestAnimationFrame(update);
	};

	const detach = () => {
		window.removeEventListener('scroll', scheduleUpdate);
		window.removeEventListener('resize', scheduleUpdate);
		const parent = wrapper.parentElement;
		if (parent) {
			parent.removeEventListener('scroll', scheduleUpdate);
		}
		if (rafId) {
			window.cancelAnimationFrame(rafId);
			rafId = 0;
		}
	};

	window.addEventListener('scroll', scheduleUpdate, { passive: true });
	window.addEventListener('resize', scheduleUpdate);
	const parent = wrapper.parentElement;
	if (parent) {
		parent.addEventListener('scroll', scheduleUpdate, { passive: true });
	}
	scheduleUpdate();

	return true;
}

function setupWrapper(wrapper) {
	const trigger = wrapper.dataset.ffawTrigger || 'scroll';
	if (trigger === 'scroll-media') {
		setupScrollMediaControl(wrapper);
		return;
	}
	const isLoopMode = trigger === 'loop' || wrapper.dataset.ffawLoop === '1';
	const configuredDirection = wrapper.dataset.ffawDirection || 'up';
	const usesScrollLinkedDirection =
		configuredDirection === 'scroll' || configuredDirection === 'scroll-reverse';
	if (usesScrollLinkedDirection) {
		attachScrollDirectionTracker();
	}
	const resolveDirectionOverride = () => {
		if (!usesScrollLinkedDirection) {
			return undefined;
		}
		return resolveScrollLinkedDirection(configuredDirection);
	};
	const resolveCurrentAnimationState = () =>
		resolveWrapperAnimationState(wrapper, resolveDirectionOverride());
	const initialAnimationState = resolveCurrentAnimationState();
	const { preset, textGranularity, keyframes } = initialAnimationState;
	const once = wrapper.dataset.ffawOnce === '1';
	const clickToggle = wrapper.dataset.ffawClickToggle === '1';
	const hideUntilHover = wrapper.dataset.ffawHideUntilHover === '1';
	const threshold = Number(wrapper.dataset.ffawThreshold || 0.25);
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let playCount = 0;

	if (reduceMotion) {
		wrapper.classList.add('abw-motion-reduced');
		return;
	}

	const shouldPrimeHover = trigger === 'hover' && hideUntilHover && keyframesStartHidden(keyframes);
	if (shouldPrimeHover) {
		wrapper.classList.add('abw-hide-until-hover');
	} else {
		wrapper.classList.remove('abw-hide-until-hover');
	}
	const shouldPrimeInitialState = shouldPrimeHover || ['scroll', 'load', 'click', 'loop'].includes(trigger);
	if (shouldPrimeInitialState) {
		const initialTargets = mergeFollowTargets(
			wrapper,
			getAnimationTargets(wrapper, preset, textGranularity)
		);
		initialTargets.forEach((target) => {
			applyInitialState(target, keyframes);
		});
	}

	const triggerWrapperAnimation = (config = {}) => {
		if (trigger === 'hover') {
			wrapper.classList.remove('abw-hide-until-hover');
		}
		playCount += 1;
		animateChildren(wrapper, false, {
			...config,
			directionOverride: config.directionOverride || resolveDirectionOverride(),
		});
		if (playCount > 1 && !config.fromParentReplay) {
			const nestedWrappers = wrapper.querySelectorAll('.wp-block-animation-block-wrapper-wrapper.abw-wrapper');
			nestedWrappers.forEach((nestedWrapper) => {
				if (nestedWrapper === wrapper || typeof nestedWrapper.abwReplay !== 'function') {
					return;
				}
				const nestedParent = nestedWrapper.parentElement
					? nestedWrapper.parentElement.closest('.wp-block-animation-block-wrapper-wrapper.abw-wrapper')
					: null;
				if (nestedParent !== wrapper) {
					return;
				}
				const nestedTrigger = nestedWrapper.dataset.ffawTrigger || 'scroll';
				if (nestedTrigger === 'loop') {
					nestedWrapper.abwReplay({
						fromParentReplay: true,
						startDelay: 0,
					});
					return;
				}
				if (nestedTrigger !== 'scroll') {
					return;
				}
				const nestedThreshold = Number(nestedWrapper.dataset.ffawThreshold || 0.25);
				if (!isWrapperInViewport(nestedWrapper, nestedThreshold)) {
					return;
				}
				nestedWrapper.abwReplay({
					fromParentReplay: true,
				});
			});
		}
	};
	wrapper.abwReplay = (config = {}) => triggerWrapperAnimation(config);

	if (trigger === 'load') {
		window.requestAnimationFrame(() => {
			triggerWrapperAnimation();
		});
		return;
	}

	if (trigger === 'hover') {
		wrapper.addEventListener('mouseenter', () => {
			triggerWrapperAnimation();
		});
		return;
	}

	if (trigger === 'click') {
		let isOn = false;
		wrapper.addEventListener('click', () => {
			if (!clickToggle) {
				triggerWrapperAnimation();
				return;
			}
			isOn = !isOn;
			if (isOn) {
				triggerWrapperAnimation();
				return;
			}
			animateChildren(wrapper, true, {
				directionOverride: resolveDirectionOverride(),
			});
		});
		return;
	}

	if (isLoopMode) {
		const initialDelay = resolveInheritedDelay(wrapper, Number(wrapper.dataset.ffawDelay || 0));
		window.setTimeout(() => {
			if (!document.body.contains(wrapper)) {
				return;
			}
			triggerWrapperAnimation({
				startDelay: 0,
			});
		}, initialDelay);
		return;
	}

	if (trigger === 'scroll' && 'IntersectionObserver' in window) {
		let hasPlayed = false;
		let isInView = false;
		let rafCheck = 0;
		const meetsThreshold = (entry) =>
			!!entry.isIntersecting && Number(entry.intersectionRatio || 0) >= threshold;
		const detachManualCheck = () => {
			window.removeEventListener('scroll', scheduleManualCheck);
			window.removeEventListener('resize', scheduleManualCheck);
			if (rafCheck) {
				window.cancelAnimationFrame(rafCheck);
				rafCheck = 0;
			}
		};
		const runManualInViewCheck = () => {
			rafCheck = 0;
			if (!document.body.contains(wrapper)) {
				detachManualCheck();
				return;
			}
			if (isInView) {
				return;
			}
			if (isWrapperInViewport(wrapper, threshold)) {
				isInView = true;
				hasPlayed = true;
				triggerWrapperAnimation();
				if (once) {
					observer.unobserve(wrapper);
					detachManualCheck();
				}
			}
		};
		const scheduleManualCheck = () => {
			if (rafCheck) {
				return;
			}
			rafCheck = window.requestAnimationFrame(runManualInViewCheck);
		};

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (meetsThreshold(entry)) {
						if (isInView) {
							return;
						}
						isInView = true;
						triggerWrapperAnimation();
						hasPlayed = true;
						if (once) {
							observer.unobserve(wrapper);
							detachManualCheck();
						}
					} else if (isInView) {
						isInView = false;
						if (once || !hasPlayed) {
							return;
						}
						const resetAnimationState = resolveCurrentAnimationState();
						const resetTargets = mergeFollowTargets(
							wrapper,
							getAnimationTargets(
								wrapper,
								resetAnimationState.preset,
								resetAnimationState.textGranularity
							)
						);
						resetTargets.forEach((target) => {
							applyInitialState(target, resetAnimationState.keyframes);
						});
					}
				});
			},
			{ threshold }
		);
		observer.observe(wrapper);
		window.addEventListener('scroll', scheduleManualCheck, { passive: true });
		window.addEventListener('resize', scheduleManualCheck);

		// Above-the-fold wrappers can miss an immediate threshold callback on some layouts.
		// Run one paint-time check so the first section animates without waiting for scroll.
		scheduleManualCheck();

		return;
	}

	triggerWrapperAnimation();
}

function initAnimationWrappers() {
	const wrappers = document.querySelectorAll('.wp-block-animation-block-wrapper-wrapper.abw-wrapper');
	wrappers.forEach(setupWrapper);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initAnimationWrappers);
} else {
	initAnimationWrappers();
}
