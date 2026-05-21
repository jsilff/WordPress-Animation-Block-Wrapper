(function (wp) {
	const { registerBlockType } = wp.blocks;
	const { InspectorControls, InnerBlocks, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { PanelBody, SelectControl, RangeControl, ToggleControl, Tooltip } = wp.components;
	const { __ } = wp.i18n;
	const { useSelect } = wp.data;
	const { useEffect, useMemo, useState, Fragment, createElement } = wp.element;

	const metadata = {
		name: 'animation-block-wrapper/wrapper',
		title: __('AniLibrary', 'anilibrary'),
		description: __('Wrap any block and add easy animations.', 'anilibrary'),
		category: 'design',
		icon: 'format-image',
		attributes: {
			preset: { type: 'string', default: 'fade' },
			contentKind: { type: 'string', default: 'mixed' },
			trigger: { type: 'string', default: 'scroll' },
			intensity: { type: 'number', default: 100 },
			direction: { type: 'string', default: 'up' },
			zoomMode: { type: 'string', default: 'in' },
			bounceCount: { type: 'number', default: 1 },
			duration: { type: 'number', default: 700 },
			delay: { type: 'number', default: 0 },
			stagger: { type: 'number', default: 0 },
			easing: { type: 'string', default: 'ease-out' },
			once: { type: 'boolean', default: true },
			threshold: { type: 'number', default: 0.25 },
			loop: { type: 'boolean', default: false },
			clickToggle: { type: 'boolean', default: false },
			hideUntilHover: { type: 'boolean', default: false },
			inheritParentDelay: { type: 'boolean', default: false },
			followParentAnimation: { type: 'boolean', default: false },
			textGranularity: { type: 'string', default: 'word' },
		},
	};

	const PRESETS = [
		{ id: 'fade', label: __('Fade', 'anilibrary'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'entrance', preview: 'up' },
		{ id: 'slide', label: __('Slide', 'anilibrary'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'entrance', preview: 'up-strong' },
		{ id: 'zoom', label: __('Zoom', 'anilibrary'), kinds: ['media', 'mixed', 'layout', 'text'], category: 'entrance', preview: 'zoom-in' },
		{ id: 'blur-in', label: __('Blur', 'anilibrary'), kinds: ['media', 'mixed', 'text'], category: 'entrance', preview: 'blur' },
		{ id: 'rotate-in', label: __('Rotate', 'anilibrary'), kinds: ['mixed', 'layout', 'media', 'text'], category: 'entrance', preview: 'rotate' },
		{ id: 'flip', label: __('Flip', 'anilibrary'), kinds: ['mixed', 'layout', 'media', 'text'], category: 'entrance', preview: 'flip' },
		{ id: 'text-rise', label: __('Rise', 'anilibrary'), kinds: ['text', 'mixed'], category: 'text', preview: 'text-rise' },
		{ id: 'word-cascade', label: __('Cascade', 'anilibrary'), kinds: ['text'], category: 'text', preview: 'cascade' },
		{ id: 'letter-pop', label: __('Pop', 'anilibrary'), kinds: ['text'], category: 'text', preview: 'letter-pop' },
		{ id: 'pulse-soft', label: __('Pulse', 'anilibrary'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'loop', preview: 'pulse' },
		{ id: 'float-soft', label: __('Float', 'anilibrary'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'loop', preview: 'float' },
		{ id: 'bounce-soft', label: __('Bounce', 'anilibrary'), kinds: ['text', 'mixed', 'layout', 'media'], category: 'loop', preview: 'bounce' },
	];

	const RECOMMENDATIONS = {
		text: ['text-rise', 'fade', 'letter-pop', 'word-cascade'],
		media: ['zoom', 'blur-in', 'slide', 'fade'],
		layout: ['fade', 'slide', 'rotate-in', 'pulse-soft'],
		mixed: ['fade', 'zoom', 'slide', 'pulse-soft'],
	};

	const PRESET_DESCRIPTIONS = {
		fade: __('Fades in smoothly.', 'anilibrary'),
		slide: __('Slides into place.', 'anilibrary'),
		zoom: __('Zooms in or out to draw attention.', 'anilibrary'),
		'blur-in': __('Starts soft and sharpens into focus.', 'anilibrary'),
		'rotate-in': __('Rotates in gently.', 'anilibrary'),
		flip: __('Flips in from a chosen direction.', 'anilibrary'),
		'text-rise': __('Text moves in from up or down.', 'anilibrary'),
		'word-cascade': __('Words appear one after another.', 'anilibrary'),
		'letter-pop': __('Text pops in quickly.', 'anilibrary'),
		'pulse-soft': __('Gently pulses. Best with Loop trigger.', 'anilibrary'),
		'float-soft': __('Gently drifts. Best with Loop trigger.', 'anilibrary'),
		'bounce-soft': __('Bounces playfully. Best with Loop trigger.', 'anilibrary'),
	};

	const LIBRARY_CATEGORIES = [
		{ value: 'recommended', label: __('Recommended', 'anilibrary') },
		{ value: 'entrance', label: __('Entrance', 'anilibrary') },
		{ value: 'text', label: __('Text', 'anilibrary') },
		{ value: 'loop', label: __('Loop / Attention', 'anilibrary') },
		{ value: 'all', label: __('All', 'anilibrary') },
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
		if (unit === 'character') return 22;
		if (unit === 'line') return 120;
		return 55;
	}

	function isDirectionalPreset(presetId) {
		return ['fade', 'slide', 'rotate-in', 'float-soft', 'flip', 'text-rise'].indexOf(presetId) !== -1;
	}

	function formatDelaySeconds(ms) {
		const seconds = Math.max(0, Number(ms) || 0) / 1000;
		const decimals = seconds < 1 ? 2 : 1;
		const normalized = Number(seconds.toFixed(decimals));
		return normalized + 'sec';
	}

	function getTriggerBadgeLabel(trigger) {
		const labels = {
			scroll: __('Scroll', 'anilibrary'),
			load: __('Load', 'anilibrary'),
			hover: __('Hover', 'anilibrary'),
			click: __('Click', 'anilibrary'),
			loop: __('Loop continuously', 'anilibrary'),
		};
		return labels[trigger] || __('Scroll', 'anilibrary');
	}

	function getDirectionOptions(presetId) {
		const scrollLinkedOptions = [
			{ label: __('Scroll Direction', 'anilibrary'), value: 'scroll' },
			{ label: __('Reverse Scroll Direction', 'anilibrary'), value: 'scroll-reverse' },
		];
		if (presetId === 'text-rise') {
			return [
				{ label: __('Up', 'anilibrary'), value: 'up' },
				{ label: __('Down', 'anilibrary'), value: 'down' },
				...scrollLinkedOptions,
			];
		}
		if (presetId === 'rotate-in') {
			return [
				{ label: __('Clockwise', 'anilibrary'), value: 'clockwise' },
				{ label: __('Counterclockwise', 'anilibrary'), value: 'counterclockwise' },
			];
		}
		if (presetId === 'flip') {
			return [
				{ label: __('Left', 'anilibrary'), value: 'left' },
				{ label: __('Right', 'anilibrary'), value: 'right' },
				{ label: __('Vertical', 'anilibrary'), value: 'vertical' },
				{ label: __('Horizontal', 'anilibrary'), value: 'horizontal' },
			];
		}
		return [
			{ label: __('Up', 'anilibrary'), value: 'up' },
			{ label: __('Down', 'anilibrary'), value: 'down' },
			{ label: __('Left', 'anilibrary'), value: 'left' },
			{ label: __('Right', 'anilibrary'), value: 'right' },
			...scrollLinkedOptions,
		];
	}

	function renderPresetPreview(type) {
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
			return createElement(
				'svg',
				{ viewBox: '0 0 256 256', className: 'abw-preset-svg', 'aria-hidden': 'true', focusable: 'false' },
				createElement('path', { d: solidPath, className: 'abw-preset-svg-solid' })
			);
		}

		return createElement(
			'svg',
			{ viewBox: '0 0 24 24', className: 'abw-preset-svg', 'aria-hidden': 'true', focusable: 'false' },
			createElement('rect', { x: 2.5, y: 2.5, width: 19, height: 19, rx: 4, ry: 4, className: 'abw-preset-svg-frame' }),
			createElement('path', { d: 'M8 12H16', className: 'abw-preset-svg-line' })
		);
	}

	function detectContentKind(innerBlocks) {
		if (!innerBlocks || !innerBlocks.length) return 'mixed';
		const names = [];
		const stack = innerBlocks.slice();
		while (stack.length) {
			const block = stack.shift();
			if (!block) continue;
			names.push(block.name || '');
			if (Array.isArray(block.innerBlocks) && block.innerBlocks.length) {
				stack.push.apply(stack, block.innerBlocks);
			}
		}
		const textMatcher = /core\/(paragraph|heading|list|quote|code|details|verse|preformatted)/;
		const mediaMatcher = /core\/(image|gallery|cover|media-text|video|audio|file)/;
		const layoutMatcher = /core\/(group|columns|column|row|stack|grid|spacer)/;
		let textCount = 0;
		let mediaCount = 0;
		let layoutCount = 0;
		names.forEach(function (name) {
			if (textMatcher.test(name)) textCount += 1;
			if (mediaMatcher.test(name)) mediaCount += 1;
			if (layoutMatcher.test(name)) layoutCount += 1;
		});
		if (textCount > 0 && mediaCount === 0 && layoutCount <= textCount) return 'text';
		if (mediaCount > 0 && textCount === 0) return 'media';
		if (layoutCount > 0 && textCount === 0 && mediaCount === 0) return 'layout';
		return 'mixed';
	}

	registerBlockType(metadata.name, {
		apiVersion: 3,
		title: metadata.title,
		description: metadata.description,
		category: metadata.category,
		icon: metadata.icon,
		attributes: metadata.attributes,
		supports: {
			html: false,
			anchor: true,
			spacing: { margin: true, padding: true },
			layout: true,
		},
		edit: function (props) {
			const { attributes, setAttributes, clientId } = props;
			const {
				preset, contentKind, trigger, intensity, direction, zoomMode, bounceCount,
				duration, delay, stagger, easing, once, threshold, loop, clickToggle, hideUntilHover, textGranularity, inheritParentDelay, followParentAnimation,
			} = attributes;
			const [libraryCategory, setLibraryCategory] = useState('recommended');

			const innerBlocks = useSelect(function (select) {
				const block = select('core/block-editor').getBlock(clientId);
				return (block && block.innerBlocks) || [];
			}, [clientId]);
			const hasAnimationWrapperParent = useSelect(function (select) {
				const editorStore = select('core/block-editor');
				const parentIds = editorStore.getBlockParents(clientId);
				return parentIds.some(function (id) {
					const parentBlock = editorStore.getBlock(id);
					return (parentBlock && parentBlock.name) === metadata.name;
				});
			}, [clientId]);
			const effectiveDelayMs = useSelect(function (select) {
				const editorStore = select('core/block-editor');
				const findNearestWrapperAncestor = function (blockId) {
					let parentId = editorStore.getBlockRootClientId(blockId);
					while (parentId) {
						const parentBlock = editorStore.getBlock(parentId);
						if ((parentBlock && parentBlock.name) === metadata.name) {
							return parentId;
						}
						parentId = editorStore.getBlockRootClientId(parentId);
					}
					return null;
				};
				const resolveDelay = function (blockId) {
					const visited = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
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
			}, [clientId]);

			const detectedKind = useMemo(function () { return detectContentKind(innerBlocks); }, [innerBlocks]);
			const filteredPresets = useMemo(function () {
				return PRESETS.filter(function (item) { return item.kinds.indexOf(detectedKind) !== -1; });
			}, [detectedKind]);

			const recommended = RECOMMENDATIONS[detectedKind] || RECOMMENDATIONS.mixed;
			const primaryRecommendation = recommended.find(function (id) {
				return filteredPresets.some(function (item) { return item.id === id; });
			});

			const displayPresets = useMemo(function () {
				const recommendedSet = new Set(recommended);
				const basePresets = (libraryCategory === 'all' || libraryCategory === 'recommended')
					? filteredPresets
					: filteredPresets.filter(function (item) { return item.category === libraryCategory; });
				return basePresets.slice().sort(function (a, b) {
					const aRank = recommendedSet.has(a.id) ? recommended.indexOf(a.id) : 100;
					const bRank = recommendedSet.has(b.id) ? recommended.indexOf(b.id) : 100;
					return aRank - bRank || a.label.localeCompare(b.label);
				});
			}, [filteredPresets, libraryCategory, recommended]);

			useEffect(function () {
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

				const hasPreset = filteredPresets.some(function (item) { return item.id === preset; });
				if (!hasPreset && filteredPresets.length) {
					updates.preset = primaryRecommendation || filteredPresets[0].id;
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
					const validDirections = getDirectionOptions(preset).map(function (option) { return option.value; });
					if (validDirections.indexOf(direction) === -1) {
						updates.direction = preset === 'flip' ? 'vertical' : validDirections[0];
						shouldUpdate = true;
					}
				}

				if (preset !== 'zoom' && zoomMode !== 'in') {
					updates.zoomMode = 'in';
					shouldUpdate = true;
				}

				if (preset === 'zoom' && ['in', 'out'].indexOf(zoomMode) === -1) {
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
				? __('Delayed', 'anilibrary') + ' ' + formatDelaySeconds(effectiveDelayMs)
				: '';
			const activePreset = PRESETS.find(function (item) { return item.id === preset; });
			const presetName = activePreset ? activePreset.label : preset;
			const presetBadgeLabel = presetName + ': ' + getTriggerBadgeLabel(trigger);
			const blockProps = useBlockProps({
				className: 'abw-editor-kind-' + detectedKind + ' abw-editor-drop-zone' + (isDelayed ? ' abw-editor-is-delayed' : ''),
			});
			const innerBlocksProps = useInnerBlocksProps(blockProps, { renderAppender: InnerBlocks.ButtonBlockAppender });
			const children = innerBlocksProps.children;
			const innerBlocksWrapperProps = Object.assign({}, innerBlocksProps);
			delete innerBlocksWrapperProps.children;

			return createElement(
				Fragment,
				null,
				createElement(
					InspectorControls,
					null,
					createElement(
						PanelBody,
						{ title: __('AniLibrary Presets', 'anilibrary'), initialOpen: true },
						createElement(SelectControl, {
							label: __('Show Presets', 'anilibrary'),
							value: libraryCategory,
							options: LIBRARY_CATEGORIES,
							onChange: function (value) { setLibraryCategory(value); },
						}),
						createElement(
							'div',
							{ className: 'abw-preset-grid', role: 'listbox', 'aria-label': __('Animation styles', 'anilibrary') },
							displayPresets.map(function (item) {
								const selected = item.id === preset;
								const tooltipText = PRESET_DESCRIPTIONS[item.id] || item.label;
								return createElement(
									Tooltip,
									{
										key: item.id,
										text: tooltipText,
										placement: 'top',
									},
									createElement(
										'button',
										{
											type: 'button',
											className: 'abw-preset-card' + (selected ? ' is-selected' : ''),
											onClick: function () { setAttributes({ preset: item.id }); },
											'aria-pressed': selected,
											'aria-label': item.label + ': ' + tooltipText,
										},
										renderPresetPreview(item.preview),
										createElement('span', { className: 'abw-preset-card-label' }, item.label)
									)
								);
							})
						)
					),
					createElement(
						PanelBody,
						{ title: __('Animation Settings', 'anilibrary'), initialOpen: false },
							createElement(SelectControl, {
								label: __('Trigger', 'anilibrary'),
								value: trigger,
							options: [
								{ label: __('When scrolled into view', 'anilibrary'), value: 'scroll' },
								{ label: __('When page loads', 'anilibrary'), value: 'load' },
								{ label: __('On hover', 'anilibrary'), value: 'hover' },
								{ label: __('On click', 'anilibrary'), value: 'click' },
								{ label: __('Loop continuously', 'anilibrary'), value: 'loop' },
								],
								onChange: function (value) { setAttributes({ trigger: value, loop: value === 'loop' }); },
							}),
						trigger === 'scroll'
								? createElement(RangeControl, {
										label: __('How much should be visible before it starts (%)', 'anilibrary'),
										value: Math.round((Number(threshold) || 0.25) * 100),
										onChange: function (value) { setAttributes({ threshold: Math.max(0.05, Math.min(1, Number(value || 25) / 100)) }); },
										min: 5,
										max: 100,
										step: 5,
								  })
								: null,
							createElement(RangeControl, {
								label: __('Effect strength (%)', 'anilibrary'),
								value: intensity,
							onChange: function (value) { setAttributes({ intensity: Number(value) || 100 }); },
							min: 10,
							max: 200,
							step: 10,
						}),
						createElement(RangeControl, {
							label: __('Animation length (ms)', 'anilibrary'),
							value: duration,
							onChange: function (value) { setAttributes({ duration: Number(value) || 700 }); },
							min: 100,
							max: 6000,
							step: 50,
						}),
						createElement(RangeControl, {
							label: __('Start delay (ms)', 'anilibrary'),
							value: delay,
							onChange: function (value) { setAttributes({ delay: Number(value) || 0 }); },
							min: 0,
							max: 3000,
							step: 50,
						}),
						hasAnimationWrapperParent
							? createElement(ToggleControl, {
									label: __('Add parent delay (nested blocks)', 'anilibrary'),
									checked: inheritParentDelay,
									onChange: function (value) { setAttributes({ inheritParentDelay: value }); },
									help: __('Adds the parent block delay to this block delay.', 'anilibrary'),
							  })
							: null,
						hasAnimationWrapperParent
							? createElement(ToggleControl, {
									label: __('Follow parent animation', 'anilibrary'),
									checked: followParentAnimation,
									onChange: function (value) { setAttributes({ followParentAnimation: value }); },
									help: __('Lets this nested block follow the parent effect state (for example, start hidden if parent starts hidden).', 'anilibrary'),
							  })
							: null,
						createElement(SelectControl, {
							label: __('Motion style', 'anilibrary'),
							value: easing,
							options: [
								{ label: __('Smooth out', 'anilibrary'), value: 'ease-out' },
								{ label: __('Smooth in and out', 'anilibrary'), value: 'ease-in-out' },
								{ label: __('Steady speed', 'anilibrary'), value: 'linear' },
								{ label: __('Extra smooth', 'anilibrary'), value: 'cubic-bezier(0.65,0,0.35,1)' },
							],
							onChange: function (value) { setAttributes({ easing: value }); },
						}),
						isDirectionalPreset(preset)
							? createElement(SelectControl, {
									label: __('Direction', 'anilibrary'),
									value: direction,
									options: getDirectionOptions(preset),
									onChange: function (value) { setAttributes({ direction: value }); },
							  })
							: null,
						preset === 'zoom'
							? createElement(SelectControl, {
									label: __('Zoom direction', 'anilibrary'),
									value: zoomMode,
									options: [
										{ label: __('In', 'anilibrary'), value: 'in' },
										{ label: __('Out', 'anilibrary'), value: 'out' },
									],
									onChange: function (value) { setAttributes({ zoomMode: value }); },
							  })
							: null,
						preset === 'bounce-soft'
							? createElement(RangeControl, {
									label: __('Number of bounces', 'anilibrary'),
									value: bounceCount,
									onChange: function (value) { setAttributes({ bounceCount: Number(value) || 1 }); },
									min: 1,
									max: 8,
									step: 1,
							  })
							: null,
							trigger === 'click'
								? createElement(ToggleControl, {
										label: __('Click again to reverse', 'anilibrary'),
									checked: clickToggle,
									onChange: function (value) { setAttributes({ clickToggle: value }); },
							  })
							: null,
						trigger === 'hover' && HOVER_HIDE_SUPPORTED_PRESETS.has(preset)
							? createElement(ToggleControl, {
									label: __('Hide until hover', 'anilibrary'),
									checked: hideUntilHover,
									onChange: function (value) { setAttributes({ hideUntilHover: value }); },
									help: __('Keeps this hidden until you hover.', 'anilibrary'),
							  })
							: null,
						trigger !== 'loop'
							? createElement(ToggleControl, {
									label: __('Play once', 'anilibrary'),
									checked: once,
									onChange: function (value) { setAttributes({ once: value }); },
							  })
							: null,
						detectedKind === 'text'
							? createElement(SelectControl, {
									label: __('Text animation mode', 'anilibrary'),
									value: textGranularity,
									options: [
										{ label: __('Word by word', 'anilibrary'), value: 'word' },
										{ label: __('Letter by letter', 'anilibrary'), value: 'character' },
										{ label: __('Line by line', 'anilibrary'), value: 'line' },
									],
									onChange: function (value) {
										setAttributes({
											textGranularity: value,
											stagger: Number(stagger) === 0 ? getDefaultTextStagger(value) : stagger,
										});
									},
							  })
							: null,
						detectedKind === 'text' && trigger !== 'loop'
							? createElement(RangeControl, {
									label: __('Gap between words/letters (ms)', 'anilibrary'),
									value: stagger,
									onChange: function (value) { setAttributes({ stagger: Number(value) || 0 }); },
									min: 0,
									max: 1000,
									step: 25,
							  })
							: null
					)
				),
				createElement(
					'div',
					innerBlocksWrapperProps,
					createElement(
						'div',
						{ className: 'abw-editor-badges', 'aria-hidden': 'true' },
						isDelayed
							? createElement('span', { className: 'abw-editor-badge is-delay' }, delayBadgeLabel)
							: null,
						createElement('span', { className: 'abw-editor-badge is-preset' }, presetBadgeLabel)
					),
					children
				)
			);
		},
		save: function (props) {
			const {
				preset, contentKind, trigger, intensity, direction, zoomMode, bounceCount,
				duration, delay, stagger, easing, once, threshold, loop, clickToggle, hideUntilHover, textGranularity, inheritParentDelay, followParentAnimation,
			} = props.attributes;

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

			return createElement('div', blockProps, createElement(InnerBlocks.Content));
		},
	});
})(window.wp);
