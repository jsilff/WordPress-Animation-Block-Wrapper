import { registerBlockType } from '@wordpress/blocks';
import {
	InspectorControls,
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	ToggleControl,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';

import metadata from '../block.json';

const PRESETS = [
	{ id: 'fade', label: __('Fade', 'animation-block-wrapper'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'entrance', preview: 'up' },
	{ id: 'slide', label: __('Slide', 'animation-block-wrapper'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'entrance', preview: 'up-strong' },
	{ id: 'zoom', label: __('Zoom', 'animation-block-wrapper'), kinds: ['media', 'mixed', 'layout', 'text'], category: 'entrance', preview: 'zoom-in' },
	{ id: 'blur-in', label: __('Blur', 'animation-block-wrapper'), kinds: ['media', 'mixed', 'text'], category: 'entrance', preview: 'blur' },
	{ id: 'rotate-in', label: __('Rotate', 'animation-block-wrapper'), kinds: ['mixed', 'layout', 'media', 'text'], category: 'entrance', preview: 'rotate' },
	{ id: 'flip', label: __('Flip', 'animation-block-wrapper'), kinds: ['mixed', 'layout', 'media', 'text'], category: 'entrance', preview: 'flip' },
	{ id: 'text-rise', label: __('Rise', 'animation-block-wrapper'), kinds: ['text', 'mixed'], category: 'text', preview: 'text-rise' },
	{ id: 'word-cascade', label: __('Cascade', 'animation-block-wrapper'), kinds: ['text'], category: 'text', preview: 'cascade' },
	{ id: 'letter-pop', label: __('Pop', 'animation-block-wrapper'), kinds: ['text'], category: 'text', preview: 'letter-pop' },
	{ id: 'pulse-soft', label: __('Pulse', 'animation-block-wrapper'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'loop', preview: 'pulse' },
	{ id: 'float-soft', label: __('Float', 'animation-block-wrapper'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'loop', preview: 'float' },
	{ id: 'bounce-soft', label: __('Bounce', 'animation-block-wrapper'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'loop', preview: 'bounce' },
];

const RECOMMENDATIONS = {
	text: ['text-rise', 'fade', 'letter-pop', 'word-cascade'],
	media: ['zoom', 'blur-in', 'slide', 'fade'],
	layout: ['fade', 'slide', 'rotate-in', 'pulse-soft'],
	mixed: ['fade', 'zoom', 'slide', 'pulse-soft'],
};

const PRESET_DESCRIPTIONS = {
	fade: __('Fades in smoothly.', 'animation-block-wrapper'),
	slide: __('Slides into place.', 'animation-block-wrapper'),
	zoom: __('Zooms in or out to draw attention.', 'animation-block-wrapper'),
	'blur-in': __('Starts soft and sharpens into focus.', 'animation-block-wrapper'),
	'rotate-in': __('Rotates in gently.', 'animation-block-wrapper'),
	flip: __('Flips in from a chosen direction.', 'animation-block-wrapper'),
	'text-rise': __('Text moves in from up or down.', 'animation-block-wrapper'),
	'word-cascade': __('Words appear one after another.', 'animation-block-wrapper'),
	'letter-pop': __('Text pops in quickly.', 'animation-block-wrapper'),
	'pulse-soft': __('Gently pulses. Best with Loop trigger.', 'animation-block-wrapper'),
	'float-soft': __('Gently drifts. Best with Loop trigger.', 'animation-block-wrapper'),
	'bounce-soft': __('Bounces playfully. Best with Loop trigger.', 'animation-block-wrapper'),
};

const LIBRARY_CATEGORIES = [
	{ value: 'recommended', label: __('Recommended', 'animation-block-wrapper') },
	{ value: 'entrance', label: __('Entrance', 'animation-block-wrapper') },
	{ value: 'text', label: __('Text', 'animation-block-wrapper') },
	{ value: 'loop', label: __('Loop / Attention', 'animation-block-wrapper') },
	{ value: 'all', label: __('All', 'animation-block-wrapper') },
];

const HOVER_HIDE_SUPPORTED_PRESETS = new Set([
	'fade',
	'slide',
	'zoom',
	'blur-in',
	'rotate-in',
	'flip',
	'text-rise',
	'word-cascade',
	'letter-pop',
	'fade-up',
	'fade-down',
	'fade-left',
	'fade-right',
	'slide-up',
	'slide-down',
	'slide-left',
	'slide-right',
	'zoom-in',
	'zoom-out',
]);

function getDefaultTextStagger(unit) {
	if (unit === 'character') {
		return 22;
	}
	if (unit === 'line') {
		return 120;
	}
	return 55;
}

function isDirectionalPreset(presetId) {
	return ['fade', 'slide', 'rotate-in', 'float-soft', 'flip', 'text-rise'].includes(presetId);
}

function formatDelaySeconds(ms) {
	const seconds = Math.max(0, Number(ms) || 0) / 1000;
	const decimals = seconds < 1 ? 2 : 1;
	const normalized = Number(seconds.toFixed(decimals));
	return `${normalized}sec`;
}

function getTriggerBadgeLabel(trigger) {
	const labels = {
		scroll: __('Scroll', 'animation-block-wrapper'),
		load: __('Load', 'animation-block-wrapper'),
		hover: __('Hover', 'animation-block-wrapper'),
		click: __('Click', 'animation-block-wrapper'),
		loop: __('Loop', 'animation-block-wrapper'),
	};
	return labels[trigger] || __('Scroll', 'animation-block-wrapper');
}

function getDirectionOptions(presetId) {
	const scrollLinkedOptions = [
		{ label: __('Scroll Direction', 'animation-block-wrapper'), value: 'scroll' },
		{ label: __('Reverse Scroll Direction', 'animation-block-wrapper'), value: 'scroll-reverse' },
	];
	if (presetId === 'text-rise') {
		return [
			{ label: __('Up', 'animation-block-wrapper'), value: 'up' },
			{ label: __('Down', 'animation-block-wrapper'), value: 'down' },
			...scrollLinkedOptions,
		];
	}
	if (presetId === 'rotate-in') {
		return [
			{ label: __('Clockwise', 'animation-block-wrapper'), value: 'clockwise' },
			{ label: __('Counterclockwise', 'animation-block-wrapper'), value: 'counterclockwise' },
		];
	}
	if (presetId === 'flip') {
		return [
			{ label: __('Left', 'animation-block-wrapper'), value: 'left' },
			{ label: __('Right', 'animation-block-wrapper'), value: 'right' },
			{ label: __('Vertical', 'animation-block-wrapper'), value: 'vertical' },
			{ label: __('Horizontal', 'animation-block-wrapper'), value: 'horizontal' },
		];
	}
	return [
		{ label: __('Up', 'animation-block-wrapper'), value: 'up' },
		{ label: __('Down', 'animation-block-wrapper'), value: 'down' },
		{ label: __('Left', 'animation-block-wrapper'), value: 'left' },
		{ label: __('Right', 'animation-block-wrapper'), value: 'right' },
		...scrollLinkedOptions,
	];
}

function PresetPreview({ type }) {
	const solidIcons = {
		up: 'M80,192a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16H72A8,8,0,0,1,80,192Zm144-8H184a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm-72,0H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16ZM32,168h80a8,8,0,0,0,0-16H32a8,8,0,0,0,0,16Zm192-16H144a8,8,0,0,0,0,16h80a8,8,0,0,0,0-16Zm0-96H32a8,8,0,0,0-8,8V88a8,8,0,0,0,8,8H224a8,8,0,0,0,8-8V64A8,8,0,0,0,224,56Zm0,56H32a8,8,0,0,0-8,8v8a8,8,0,0,0,8,8H224a8,8,0,0,0,8-8v-8A8,8,0,0,0,224,112Z',
		'up-strong': 'M231.39,123.06A8,8,0,0,1,224,128H184v80a16,16,0,0,1-16,16H88a16,16,0,0,1-16-16V128H32a8,8,0,0,1-5.66-13.66l96-96a8,8,0,0,1,11.32,0l96,96A8,8,0,0,1,231.39,123.06Z',
		'zoom-in': 'M144,120v88a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V120a8,8,0,0,1,8-8h88A8,8,0,0,1,144,120Zm64,56a8,8,0,0,0-8,8v16H176a8,8,0,0,0,0,16h24a16,16,0,0,0,16-16V184A8,8,0,0,0,208,176Zm0-72a8,8,0,0,0-8,8v32a8,8,0,0,0,16,0V112A8,8,0,0,0,208,104Zm-8-64H184a8,8,0,0,0,0,16h16V72a8,8,0,0,0,16,0V56A16,16,0,0,0,200,40Zm-56,0H112a8,8,0,0,0,0,16h32a8,8,0,0,0,0-16ZM48,88a8,8,0,0,0,8-8V56H72a8,8,0,0,0,0-16H56A16,16,0,0,0,40,56V80A8,8,0,0,0,48,88Z',
		'zoom-out': 'M144,120v88a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V120a8,8,0,0,1,8-8h88A8,8,0,0,1,144,120Zm64,56a8,8,0,0,0-8,8v16H176a8,8,0,0,0,0,16h24a16,16,0,0,0,16-16V184A8,8,0,0,0,208,176Zm0-72a8,8,0,0,0-8,8v32a8,8,0,0,0,16,0V112A8,8,0,0,0,208,104Zm-8-64H184a8,8,0,0,0,0,16h16V72a8,8,0,0,0,16,0V56A16,16,0,0,0,200,40Zm-56,0H112a8,8,0,0,0,0,16h32a8,8,0,0,0,0-16ZM48,88a8,8,0,0,0,8-8V56H72a8,8,0,0,0,0-16H56A16,16,0,0,0,40,56V80A8,8,0,0,0,48,88Z',
		blur: 'M232,128A104,104,0,0,0,54.46,54.46,104,104,0,0,0,128,232h.09A104,104,0,0,0,232,128ZM49.18,88.92l51.21,9.35L46.65,161.53A88.39,88.39,0,0,1,49.18,88.92Zm160.17,5.54a88.41,88.41,0,0,1-2.53,72.62l-51.21-9.35Zm-8.08-15.2L167.55,119,139.63,40.78a87.38,87.38,0,0,1,50.6,25A88.74,88.74,0,0,1,201.27,79.26ZM122.43,40.19l17.51,49L58.3,74.32a89.28,89.28,0,0,1,7.47-8.55A87.37,87.37,0,0,1,122.43,40.19ZM54.73,176.74,88.45,137l27.92,78.18a88,88,0,0,1-61.64-38.48Zm78.84,39.06-17.51-49L139.14,171h0l58.52,10.69a87.5,87.5,0,0,1-64.13,34.12Z',
		rotate: 'M248,144a8,8,0,0,1-16,0,96.11,96.11,0,0,0-96-96c-1.4,0-2.8,0-4.18.1A80.06,80.06,0,0,0,56,128a64.07,64.07,0,0,0,64,64,44.05,44.05,0,0,0,44-44,32,32,0,0,0-32-32,8,8,0,0,0,0,16,16,16,0,0,1,16,16,28,28,0,0,1-28,28,48.05,48.05,0,0,1-48-48,64.07,64.07,0,0,1,64-64,80.09,80.09,0,0,1,80,80,88.1,88.1,0,0,1-88,88,96.11,96.11,0,0,1-96-96A104.11,104.11,0,0,1,136,32,112.12,112.12,0,0,1,248,144Z',
		flip: 'M120,40V200a16,16,0,0,1-16,16H40a16,16,0,0,1-14.78-22.15l64-159.93.06-.14A16,16,0,0,1,120,40ZM229.33,208.84A16,16,0,0,1,216,216H152a16,16,0,0,1-16-16V40a16,16,0,0,1,30.74-6.23l.06.14,64,159.93A16,16,0,0,1,229.33,208.84ZM216,200l-.06-.15L152,40V200Z',
		'text-rise': 'M176,216a8,8,0,0,1-8,8H24a8,8,0,0,1,0-16H168A8,8,0,0,1,176,216ZM246.31,86.76,227.67,62.87l-.12-.15a39.82,39.82,0,0,0-51.28-9.12L124.7,84.38,70.76,64.54a8,8,0,0,0-5.59,0L58,67.27l-.32.13a16,16,0,0,0-4.53,26.47L75,115.06l-20.17,12.2-28.26-9.54a8,8,0,0,0-6.08.4l-3,1.47A16,16,0,0,0,13,145.8l36,35.27.12.12a39.78,39.78,0,0,0,27.28,10.87,40.18,40.18,0,0,0,20.26-5.52l147.41-88a8,8,0,0,0,2.21-11.78Z',
		cascade: 'M80,96a8,8,0,0,1-8,8H24a8,8,0,0,1,0-16H72A8,8,0,0,1,80,96Zm72,24H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Zm32-48h48a8,8,0,0,0,0-16H184a8,8,0,0,0,0,16ZM72,120H24a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8H72a8,8,0,0,0,8-8V128A8,8,0,0,0,72,120ZM232,88H184a8,8,0,0,0-8,8v96a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V96A8,8,0,0,0,232,88Zm-80,64H104a8,8,0,0,0-8,8v32a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V160A8,8,0,0,0,152,152Z',
		'letter-pop': 'M229.52,74.21a8,8,0,0,0-7.13-2A44,44,0,0,0,168,41.67a44,44,0,0,0-80,0,44,44,0,0,0-54.4,30.51,8,8,0,0,0-9.4,9.65L54.76,211.67A16,16,0,0,0,70.34,224H185.66a16,16,0,0,0,15.58-12.33L231.79,81.83A8,8,0,0,0,229.52,74.21ZM70.34,208,42.91,91.44l37.85,10.81L94.86,208ZM122.06,73.76,87.57,87.56,49,76.54a28,28,0,0,1,40.1-17.28,8,8,0,0,0,11.56-5.34,28,28,0,0,1,54.66,0,8,8,0,0,0,11.56,5.34A28,28,0,0,1,207,76.54l-38.56,11-34.49-13.8A16,16,0,0,0,122.06,73.76ZM185.66,208H161.14l14.1-105.75,37.85-10.81Z',
		pulse: 'M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm-8,96H188.64L159,188a8,8,0,0,1-6.95,4h-.46a8,8,0,0,1-6.89-4.84L103,89.92,79,132a8,8,0,0,1-7,4H48a8,8,0,0,1,0-16H67.36L97.05,68a8,8,0,0,1,14.3.82L153,166.08l24-42.05a8,8,0,0,1,6.95-4h24a8,8,0,0,1,0,16Z',
		float: 'M128,16a88.1,88.1,0,0,0-88,88c0,23.43,9.4,49.42,25.13,69.5,12.08,15.41,26.5,26,41.91,31.09L96.65,228.85A8,8,0,0,0,104,240h48a8,8,0,0,0,7.35-11.15L149,204.59c15.4-5.07,29.83-15.68,41.91-31.09C206.6,153.42,216,127.43,216,104A88.1,88.1,0,0,0,128,16Zm49.32,87.89A8.52,8.52,0,0,1,176,104a8,8,0,0,1-7.88-6.68,41.29,41.29,0,0,0-33.43-33.43,8,8,0,1,1,2.64-15.78,57.5,57.5,0,0,1,46.57,46.57A8,8,0,0,1,177.32,103.89Z',
		bounce: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm83.44,76A195.88,195.88,0,0,0,165,91,195.88,195.88,0,0,0,156,44.56,88.43,88.43,0,0,1,211.44,100ZM85,51.24a188.27,188.27,0,0,1,67.3,39.21A196.29,196.29,0,0,0,40.08,124.51,88.07,88.07,0,0,1,85,51.24Zm46.48,164.68a196.29,196.29,0,0,0,34.06-112.23A188.27,188.27,0,0,1,204.76,171,88.07,88.07,0,0,1,131.49,215.92Z',
	};

	const solidPath = solidIcons[type];
	if (solidPath) {
		return (
			<svg viewBox="0 0 256 256" className="abw-preset-svg" aria-hidden="true" focusable="false">
				<path d={solidPath} className="abw-preset-svg-solid" />
			</svg>
		);
	}

	return (
		<svg viewBox="0 0 24 24" className="abw-preset-svg" aria-hidden="true" focusable="false">
			<rect x="2.5" y="2.5" width="19" height="19" rx="4" ry="4" className="abw-preset-svg-frame" />
			<path d="M8 12H16" className="abw-preset-svg-line" />
		</svg>
	);
}

function detectContentKind(innerBlocks) {
	if (!innerBlocks || !innerBlocks.length) {
		return 'mixed';
	}

	const names = [];
	const stack = [...innerBlocks];
	while (stack.length) {
		const block = stack.shift();
		if (!block) continue;
		names.push(block.name || '');
		if (Array.isArray(block.innerBlocks) && block.innerBlocks.length) {
			stack.push(...block.innerBlocks);
		}
	}

	const isText = (name) =>
		/core\/(paragraph|heading|list|quote|code|details|verse|preformatted)/.test(name);
	const isMedia = (name) =>
		/core\/(image|gallery|cover|media-text|video|audio|file)/.test(name);
	const isLayout = (name) =>
		/core\/(group|columns|column|row|stack|grid|spacer)/.test(name);

	const textCount = names.filter(isText).length;
	const mediaCount = names.filter(isMedia).length;
	const layoutCount = names.filter(isLayout).length;

	if (textCount > 0 && mediaCount === 0 && layoutCount <= textCount) {
		return 'text';
	}
	if (mediaCount > 0 && textCount === 0) {
		return 'media';
	}
	if (layoutCount > 0 && textCount === 0 && mediaCount === 0) {
		return 'layout';
	}
	return 'mixed';
}

registerBlockType(metadata.name, {
	...metadata,
	edit: ({ attributes, setAttributes, clientId }) => {
		const {
			preset,
			contentKind,
			trigger,
			intensity,
			direction,
			zoomMode,
			bounceCount,
			duration,
			delay,
			stagger,
			easing,
			once,
			threshold,
			loop,
			clickToggle,
			hideUntilHover,
			textGranularity,
			inheritParentDelay,
			followParentAnimation,
		} = attributes;

		const [libraryCategory, setLibraryCategory] = useState('recommended');

		const innerBlocks = useSelect(
			(select) => {
				const block = select('core/block-editor').getBlock(clientId);
				return block?.innerBlocks || [];
			},
			[clientId]
		);
		const hasAnimationWrapperParent = useSelect(
			(select) => {
				const editorStore = select('core/block-editor');
				const parentIds = editorStore.getBlockParents(clientId);
				return parentIds.some((id) => editorStore.getBlock(id)?.name === metadata.name);
			},
			[clientId]
		);
		const effectiveDelayMs = useSelect(
			(select) => {
				const editorStore = select('core/block-editor');
				const findNearestWrapperAncestor = (blockId) => {
					let parentId = editorStore.getBlockRootClientId(blockId);
					while (parentId) {
						const parentBlock = editorStore.getBlock(parentId);
						if (parentBlock?.name === metadata.name) {
							return parentId;
						}
						parentId = editorStore.getBlockRootClientId(parentId);
					}
					return null;
				};
				const resolveDelay = (blockId, visited = new Set()) => {
					if (!blockId || visited.has(blockId)) {
						return 0;
					}
					visited.add(blockId);
					const block = editorStore.getBlock(blockId);
					if (!block) {
						return 0;
					}
					const attrs = block.attributes || {};
					const ownDelay = Math.max(0, Number(attrs.delay) || 0);
					if (!attrs.inheritParentDelay) {
						return ownDelay;
					}
					const parentWrapperId = findNearestWrapperAncestor(blockId);
					if (!parentWrapperId) {
						return ownDelay;
					}
					return ownDelay + resolveDelay(parentWrapperId, visited);
				};
				return resolveDelay(clientId);
			},
			[clientId]
		);

		const detectedKind = useMemo(() => detectContentKind(innerBlocks), [innerBlocks]);

		const filteredPresets = useMemo(
			() => PRESETS.filter((item) => item.kinds.includes(detectedKind)),
			[detectedKind]
		);

		const recommended = RECOMMENDATIONS[detectedKind] || RECOMMENDATIONS.mixed;
		const primaryRecommendation = recommended.find((id) =>
			filteredPresets.some((item) => item.id === id)
		);

		const displayPresets = useMemo(() => {
			const recommendedSet = new Set(recommended);
			const basePresets =
				libraryCategory === 'all' || libraryCategory === 'recommended'
					? filteredPresets
					: filteredPresets.filter((item) => item.category === libraryCategory);

			return [...basePresets].sort((a, b) => {
				const aRank = recommendedSet.has(a.id) ? recommended.indexOf(a.id) : 100;
				const bRank = recommendedSet.has(b.id) ? recommended.indexOf(b.id) : 100;
				return aRank - bRank || a.label.localeCompare(b.label);
			});
		}, [filteredPresets, libraryCategory, recommended]);

		useEffect(() => {
			const updates = {};
			let shouldUpdate = false;

			if (contentKind !== detectedKind) {
				updates.contentKind = detectedKind;
				shouldUpdate = true;
			}

			if (preset === 'flip-y') {
				updates.preset = 'flip';
				if (!direction || direction === 'up' || direction === 'down') {
					updates.direction = 'vertical';
				}
				shouldUpdate = true;
			}

			const hasPreset = filteredPresets.some((item) => item.id === preset);
			if (!hasPreset && filteredPresets.length) {
				updates.preset = primaryRecommendation || filteredPresets[0].id;
				shouldUpdate = true;
			}

			if (preset === 'fade-up') {
				updates.preset = 'fade';
				updates.direction = 'up';
				shouldUpdate = true;
			} else if (preset === 'fade-down') {
				updates.preset = 'fade';
				updates.direction = 'down';
				shouldUpdate = true;
			} else if (preset === 'fade-left') {
				updates.preset = 'fade';
				updates.direction = 'left';
				shouldUpdate = true;
			} else if (preset === 'fade-right') {
				updates.preset = 'fade';
				updates.direction = 'right';
				shouldUpdate = true;
			} else if (preset === 'slide-up') {
				updates.preset = 'slide';
				updates.direction = 'up';
				shouldUpdate = true;
			} else if (preset === 'slide-down') {
				updates.preset = 'slide';
				updates.direction = 'down';
				shouldUpdate = true;
			} else if (preset === 'slide-left') {
				updates.preset = 'slide';
				updates.direction = 'left';
				shouldUpdate = true;
			} else if (preset === 'slide-right') {
				updates.preset = 'slide';
				updates.direction = 'right';
				shouldUpdate = true;
			} else if (preset === 'zoom-in') {
				updates.preset = 'zoom';
				updates.zoomMode = 'in';
				shouldUpdate = true;
			} else if (preset === 'zoom-out') {
				updates.preset = 'zoom';
				updates.zoomMode = 'out';
				shouldUpdate = true;
			}

			if (trigger === 'loop' && once) {
				updates.once = false;
				updates.loop = true;
				shouldUpdate = true;
			}

			if (!hasAnimationWrapperParent && inheritParentDelay) {
				updates.inheritParentDelay = false;
				shouldUpdate = true;
			}

			if (!hasAnimationWrapperParent && followParentAnimation) {
				updates.followParentAnimation = false;
				shouldUpdate = true;
			}

			if (trigger !== 'hover' && hideUntilHover) {
				updates.hideUntilHover = false;
				shouldUpdate = true;
			}

			if (trigger !== 'loop' && loop) {
				updates.loop = false;
				shouldUpdate = true;
			}

			if (detectedKind === 'text' && trigger === 'loop') {
				const defaultLoopStagger = getDefaultTextStagger(textGranularity);
				if (Number(stagger) !== defaultLoopStagger) {
					updates.stagger = defaultLoopStagger;
					shouldUpdate = true;
				}
			}

			if (detectedKind === 'text' && Number(stagger) === 0) {
				updates.stagger = getDefaultTextStagger(textGranularity);
				shouldUpdate = true;
			}

			if (detectedKind !== 'text' && textGranularity !== 'word') {
				updates.textGranularity = 'word';
				shouldUpdate = true;
			}

			if (detectedKind !== 'text' && Number(stagger) !== 0) {
				updates.stagger = 0;
				shouldUpdate = true;
			}

			if (isDirectionalPreset(preset)) {
				const validDirections = getDirectionOptions(preset).map((option) => option.value);
				if (!validDirections.includes(direction)) {
					updates.direction = preset === 'flip' ? 'vertical' : validDirections[0];
					shouldUpdate = true;
				}
			}

			if (preset !== 'zoom' && zoomMode !== 'in') {
				updates.zoomMode = 'in';
				shouldUpdate = true;
			}

			if (preset === 'zoom' && !['in', 'out'].includes(zoomMode)) {
				updates.zoomMode = 'in';
				shouldUpdate = true;
			}

			if (preset !== 'bounce-soft' && bounceCount !== 1) {
				updates.bounceCount = 1;
				shouldUpdate = true;
			}

			if (preset === 'bounce-soft' && (Number(bounceCount) < 1 || Number(bounceCount) > 8)) {
				updates.bounceCount = 1;
				shouldUpdate = true;
			}

			if (shouldUpdate) {
				setAttributes(updates);
			}
		}, [bounceCount, contentKind, detectedKind, direction, filteredPresets, followParentAnimation, hasAnimationWrapperParent, hideUntilHover, inheritParentDelay, loop, once, preset, primaryRecommendation, setAttributes, stagger, textGranularity, trigger, zoomMode]);

		const isDelayed = Number(effectiveDelayMs) > 0;
		const delayBadgeLabel = isDelayed
			? `${__('Delayed', 'animation-block-wrapper')} ${formatDelaySeconds(effectiveDelayMs)}`
			: '';
		const activePreset = PRESETS.find((item) => item.id === preset);
		const presetName = activePreset ? activePreset.label : preset;
		const presetBadgeLabel = `${presetName}: ${getTriggerBadgeLabel(trigger)}`;
		const blockProps = useBlockProps({
			className: `abw-editor-kind-${detectedKind} abw-editor-drop-zone${isDelayed ? ' abw-editor-is-delayed' : ''}`,
		});
		const innerBlocksProps = useInnerBlocksProps(blockProps, {
			renderAppender: InnerBlocks.ButtonBlockAppender,
		});
		const { children, ...innerBlocksWrapperProps } = innerBlocksProps;

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('AniLibrary Presets', 'animation-block-wrapper')} initialOpen={true}>
						<SelectControl
							label={__('Show Presets', 'animation-block-wrapper')}
							value={libraryCategory}
							options={LIBRARY_CATEGORIES}
							onChange={(value) => setLibraryCategory(value)}
						/>
						<div className="abw-preset-grid" role="listbox" aria-label={__('Animation styles', 'animation-block-wrapper')}>
							{displayPresets.map((item) => {
								const selected = item.id === preset;
								const tooltipText = PRESET_DESCRIPTIONS[item.id] || item.label;
								return (
									<Tooltip key={item.id} text={tooltipText} placement="top">
										<button
											type="button"
											className={`abw-preset-card ${selected ? 'is-selected' : ''}`}
											onClick={() => setAttributes({ preset: item.id })}
											aria-pressed={selected}
											aria-label={`${item.label}: ${tooltipText}`}
										>
											<PresetPreview type={item.preview} />
											<span className="abw-preset-card-label">{item.label}</span>
										</button>
									</Tooltip>
								);
							})}
						</div>
					</PanelBody>

					<PanelBody title={__('Animation Settings', 'animation-block-wrapper')} initialOpen={false}>
						<SelectControl
							label={__('Trigger', 'animation-block-wrapper')}
							value={trigger}
							options={[
								{ label: __('When scrolled into view', 'animation-block-wrapper'), value: 'scroll' },
								{ label: __('When page loads', 'animation-block-wrapper'), value: 'load' },
								{ label: __('On hover', 'animation-block-wrapper'), value: 'hover' },
								{ label: __('On click', 'animation-block-wrapper'), value: 'click' },
								{ label: __('Loop continuously', 'animation-block-wrapper'), value: 'loop' },
							]}
							onChange={(value) => setAttributes({ trigger: value, loop: value === 'loop' })}
						/>
						{trigger === 'scroll' && (
							<RangeControl
								label={__('How much should be visible before it starts (%)', 'animation-block-wrapper')}
								value={Math.round((Number(threshold) || 0.25) * 100)}
								onChange={(value) => setAttributes({ threshold: Math.max(0.05, Math.min(1, Number(value || 25) / 100)) })}
								min={5}
								max={100}
								step={5}
							/>
						)}
						<RangeControl
							label={__('Effect strength (%)', 'animation-block-wrapper')}
							value={intensity}
							onChange={(value) => setAttributes({ intensity: Number(value) || 100 })}
							min={10}
							max={200}
							step={10}
						/>
						<RangeControl
							label={__('Animation length (ms)', 'animation-block-wrapper')}
							value={duration}
							onChange={(value) => setAttributes({ duration: Number(value) || 700 })}
							min={100}
							max={6000}
							step={50}
						/>
						<RangeControl
							label={__('Start delay (ms)', 'animation-block-wrapper')}
							value={delay}
							onChange={(value) => setAttributes({ delay: Number(value) || 0 })}
							min={0}
							max={3000}
							step={50}
						/>
						{hasAnimationWrapperParent && (
							<ToggleControl
								label={__('Add parent delay (nested blocks)', 'animation-block-wrapper')}
								checked={inheritParentDelay}
								onChange={(value) => setAttributes({ inheritParentDelay: value })}
								help={__('Adds the parent block delay to this block delay.', 'animation-block-wrapper')}
							/>
						)}
						{hasAnimationWrapperParent && (
							<ToggleControl
								label={__('Follow parent animation', 'animation-block-wrapper')}
								checked={followParentAnimation}
								onChange={(value) => setAttributes({ followParentAnimation: value })}
								help={__('Lets this nested block follow the parent effect state (for example, start hidden if parent starts hidden).', 'animation-block-wrapper')}
							/>
						)}
						<SelectControl
							label={__('Motion style', 'animation-block-wrapper')}
							value={easing}
							options={[
								{ label: __('Smooth out', 'animation-block-wrapper'), value: 'ease-out' },
								{ label: __('Smooth in and out', 'animation-block-wrapper'), value: 'ease-in-out' },
								{ label: __('Steady speed', 'animation-block-wrapper'), value: 'linear' },
								{ label: __('Extra smooth', 'animation-block-wrapper'), value: 'cubic-bezier(0.65,0,0.35,1)' },
							]}
							onChange={(value) => setAttributes({ easing: value })}
						/>
						{isDirectionalPreset(preset) && (
							<SelectControl
								label={__('Direction', 'animation-block-wrapper')}
								value={direction}
								options={getDirectionOptions(preset)}
								onChange={(value) => setAttributes({ direction: value })}
							/>
						)}
						{preset === 'zoom' && (
							<SelectControl
								label={__('Zoom direction', 'animation-block-wrapper')}
								value={zoomMode}
								options={[
									{ label: __('In', 'animation-block-wrapper'), value: 'in' },
									{ label: __('Out', 'animation-block-wrapper'), value: 'out' },
								]}
								onChange={(value) => setAttributes({ zoomMode: value })}
							/>
						)}
						{preset === 'bounce-soft' && (
							<RangeControl
								label={__('Number of bounces', 'animation-block-wrapper')}
								value={bounceCount}
								onChange={(value) => setAttributes({ bounceCount: Number(value) || 1 })}
								min={1}
								max={8}
								step={1}
							/>
						)}
						{trigger === 'click' && (
							<ToggleControl
								label={__('Click again to reverse', 'animation-block-wrapper')}
								checked={clickToggle}
								onChange={(value) => setAttributes({ clickToggle: value })}
							/>
						)}
						{trigger === 'hover' && HOVER_HIDE_SUPPORTED_PRESETS.has(preset) && (
							<ToggleControl
								label={__('Hide until hover', 'animation-block-wrapper')}
								checked={hideUntilHover}
								onChange={(value) => setAttributes({ hideUntilHover: value })}
								help={__('Keeps this hidden until you hover.', 'animation-block-wrapper')}
							/>
						)}
						{trigger !== 'loop' && (
							<ToggleControl
								label={__('Play once', 'animation-block-wrapper')}
								checked={once}
								onChange={(value) => setAttributes({ once: value })}
							/>
						)}
						{detectedKind === 'text' && (
							<SelectControl
								label={__('Text animation mode', 'animation-block-wrapper')}
								value={textGranularity}
								options={[
									{ label: __('Word by word', 'animation-block-wrapper'), value: 'word' },
									{ label: __('Letter by letter', 'animation-block-wrapper'), value: 'character' },
									{ label: __('Line by line', 'animation-block-wrapper'), value: 'line' },
								]}
								onChange={(value) =>
									setAttributes({
										textGranularity: value,
										stagger: Number(stagger) === 0 ? getDefaultTextStagger(value) : stagger,
									})
								}
							/>
						)}
						{detectedKind === 'text' && trigger !== 'loop' && (
							<RangeControl
								label={__('Gap between words/letters (ms)', 'animation-block-wrapper')}
								value={stagger}
								onChange={(value) => setAttributes({ stagger: Number(value) || 0 })}
								min={0}
								max={1000}
								step={25}
							/>
						)}
					</PanelBody>
				</InspectorControls>
				<div {...innerBlocksWrapperProps}>
					<div className="abw-editor-badges" aria-hidden="true">
						{isDelayed && <span className="abw-editor-badge is-delay">{delayBadgeLabel}</span>}
						<span className="abw-editor-badge is-preset">{presetBadgeLabel}</span>
					</div>
					{children}
				</div>
			</>
		);
	},
	save: ({ attributes }) => {
		const {
			preset,
			contentKind,
			trigger,
			intensity,
			direction,
			zoomMode,
			bounceCount,
			duration,
			delay,
			stagger,
			easing,
			once,
			threshold,
			loop,
			clickToggle,
			hideUntilHover,
			textGranularity,
			inheritParentDelay,
			followParentAnimation,
		} = attributes;

		const blockProps = useBlockProps.save({
			className: 'abw-wrapper',
			'data-ffaw-preset': preset,
			'data-ffaw-content-kind': contentKind,
			'data-ffaw-trigger': trigger,
			'data-ffaw-intensity': String(intensity),
			'data-ffaw-direction': direction,
			'data-ffaw-zoom-mode': zoomMode,
			'data-ffaw-bounce-count': String(bounceCount),
			'data-ffaw-duration': String(duration),
			'data-ffaw-delay': String(delay),
			'data-ffaw-stagger': String(stagger),
			'data-ffaw-easing': easing,
			'data-ffaw-once': once ? '1' : '0',
			'data-ffaw-threshold': String(threshold),
			'data-ffaw-loop': loop ? '1' : '0',
			'data-ffaw-click-toggle': clickToggle ? '1' : '0',
			'data-ffaw-hide-until-hover': hideUntilHover ? '1' : '0',
			'data-ffaw-text-granularity': textGranularity,
			'data-ffaw-inherit-parent-delay': inheritParentDelay ? '1' : '0',
			'data-ffaw-follow-parent-animation': followParentAnimation ? '1' : '0',
		});

		return (
			<div {...blockProps}>
				<InnerBlocks.Content />
			</div>
		);
	},
});
