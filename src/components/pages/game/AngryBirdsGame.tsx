import { useState, useEffect, useRef } from "react";
import Matter from "matter-js";

interface GameState {
	isRunning: boolean;
	birdsRemaining: number;
	gameOver: boolean;
	won: boolean;
}

interface GameElement {
	body: Matter.Body;
	element: HTMLElement;
	type: "bird" | "pig" | "block" | "slingshot";
	birdType?: number;
	health?: number;
	maxHealth?: number;
	lastDamageTime?: number;
}

interface ImpactEffect {
	id: number;
	x: number;
	y: number;
	type: "hit" | "destroy" | "bounce";
	timestamp: number;
}

const BIRD_TYPES = [
	{ src: "/game/red-bird.svg", name: "Red", power: 1.2 },
	{ src: "/game/blue-bird.svg", name: "Blue", power: 1.0 },
	{ src: "/game/yellow-bird.svg", name: "Yellow", power: 1.5 },
];

export default function AngryBirdsGame() {
	const gameContainerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const engineRef = useRef<Matter.Engine | null>(null);
	const renderRef = useRef<Matter.Render | null>(null);
	const runnerRef = useRef<Matter.Runner | null>(null);
	const currentBirdRef = useRef<GameElement | null>(null);
	const slingshotConstraintRef = useRef<Matter.Constraint | null>(null);
	const gameElementsRef = useRef<GameElement[]>([]);
	const pigsRef = useRef<GameElement[]>([]);
	const animationFrameRef = useRef<number>(0);
	const impactEffectsRef = useRef<ImpactEffect[]>([]);

	const [gameState, setGameState] = useState<GameState>({
		isRunning: false,
		birdsRemaining: 3,
		gameOver: false,
		won: false,
	});

	const [currentBirdType, setCurrentBirdType] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [impactEffects, setImpactEffects] = useState<ImpactEffect[]>([]);

	const CANVAS_WIDTH = 1024;
	const CANVAS_HEIGHT = 400;
	const SLINGSHOT_X = 150;
	const SLINGSHOT_Y = 320; // Back to original slingshot position

	const createImpactEffect = (
		x: number,
		y: number,
		type: "hit" | "destroy" | "bounce",
	) => {
		const effect: ImpactEffect = {
			id: Date.now() + Math.random(),
			x,
			y,
			type,
			timestamp: Date.now(),
		};

		impactEffectsRef.current.push(effect);
		setImpactEffects((prev) => [...prev, effect]);

		// Remove effect after animation
		setTimeout(() => {
			impactEffectsRef.current = impactEffectsRef.current.filter(
				(e) => e.id !== effect.id,
			);
			setImpactEffects((prev) => prev.filter((e) => e.id !== effect.id));
		}, 1000);
	};

	const createElement = (
		type: "img" | "div",
		className: string,
		src?: string,
	): HTMLElement => {
		if (type === "img") {
			const img = document.createElement("img");
			if (src) img.src = src;
			img.className = className;
			img.style.position = "absolute";
			img.style.pointerEvents = "none";
			img.style.userSelect = "none";
			img.draggable = false;
			return img;
		} else {
			const div = document.createElement("div");
			div.className = className;
			div.style.position = "absolute";
			div.style.pointerEvents = "none";
			return div;
		}
	};

	const updateElementPosition = (gameElement: GameElement) => {
		const { body, element } = gameElement;
		const rect = gameContainerRef.current?.getBoundingClientRect();
		if (!rect) return;

		const scaleX = rect.width / CANVAS_WIDTH;
		const scaleY = rect.height / CANVAS_HEIGHT;

		// For birds, use transform translate for better centering
		if (gameElement.type === "bird") {
			element.style.left = `${body.position.x * scaleX}px`;
			element.style.top = `${body.position.y * scaleY}px`;
			element.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
		} else {
			element.style.left = `${body.position.x * scaleX - element.offsetWidth / 2}px`;
			element.style.top = `${body.position.y * scaleY - element.offsetHeight / 2}px`;
			element.style.transform = `rotate(${body.angle}rad)`;
		}

		// Update health bar position for pigs
		if (gameElement.type === "pig" && (gameElement as any).healthBarContainer) {
			const healthBarContainer = (gameElement as any).healthBarContainer;
			healthBarContainer.style.left = `${body.position.x * scaleX - 12}px`;
			healthBarContainer.style.top = `${body.position.y * scaleY - 25}px`;
		}
	};

	const initializeGame = () => {
		if (!gameContainerRef.current || !canvasRef.current) return;

		cleanup();

		// Create engine with much slower, more cinematic physics
		const engine = Matter.Engine.create();
		engine.world.gravity.y = 0.2; // Very slow gravity for cinematic effect
		engine.constraintIterations = 3;
		engine.positionIterations = 10;
		engine.velocityIterations = 6;
		engine.timing.timeScale = 0.5; // Slow down all physics by 50%
		engineRef.current = engine;

		// Create invisible renderer for physics debugging (optional)
		const render = Matter.Render.create({
			canvas: canvasRef.current,
			engine: engine,
			options: {
				width: CANVAS_WIDTH,
				height: CANVAS_HEIGHT,
				wireframes: false,
				background: "transparent",
				showVelocity: false,
				showAngleIndicator: false,
				showDebug: false,
			},
		});
		renderRef.current = render;

		// Create runner
		const runner = Matter.Runner.create();
		runnerRef.current = runner;

		// Create world
		createWorld(engine);

		// Start physics with a delay to ensure stability
		Matter.Render.run(render);

		// Allow structures to settle completely before starting physics
		setTimeout(() => {
			Matter.Runner.run(runner, engine);
		}, 300);

		// Create first bird
		createBird();

		// Set up collision detection
		Matter.Events.on(engine, "collisionStart", handleCollisions);

		// Mouse events are now handled directly in JSX

		// Start animation loop
		startAnimationLoop();

		// Pressure check removed for simplicity
	};

	const createWorld = (engine: Matter.Engine) => {
		// Create invisible ground - thicker and more stable
		const ground = Matter.Bodies.rectangle(
			CANVAS_WIDTH / 2,
			CANVAS_HEIGHT - 10,
			CANVAS_WIDTH,
			60,
			{
				isStatic: true,
				label: "ground",
				friction: 0.9,
				restitution: 0.1,
			},
		);

		// Create visual slingshot elements only (no physics bodies)
		const slingshotLeftEl = createElement(
			"div",
			"w-2 h-20 bg-amber-800 rounded",
		);
		const slingshotRightEl = createElement(
			"div",
			"w-2 h-20 bg-amber-800 rounded",
		);

		// Position them manually since they don't have physics bodies
		slingshotLeftEl.style.left = `${((SLINGSHOT_X - 15) / CANVAS_WIDTH) * 100}%`;
		slingshotLeftEl.style.top = `${(SLINGSHOT_Y / CANVAS_HEIGHT) * 100}%`;
		slingshotLeftEl.style.transform = "translate(-50%, -50%)";
		slingshotLeftEl.style.zIndex = "20";

		slingshotRightEl.style.left = `${((SLINGSHOT_X + 15) / CANVAS_WIDTH) * 100}%`;
		slingshotRightEl.style.top = `${(SLINGSHOT_Y / CANVAS_HEIGHT) * 100}%`;
		slingshotRightEl.style.transform = "translate(-50%, -50%)";
		slingshotRightEl.style.zIndex = "20";

		gameContainerRef.current?.appendChild(slingshotLeftEl);
		gameContainerRef.current?.appendChild(slingshotRightEl);

		// Store references for cleanup (without physics bodies)
		const slingshotElements = [
			{ element: slingshotLeftEl, type: "slingshot" as const },
			{ element: slingshotRightEl, type: "slingshot" as const },
		];

		// Store in a separate ref for cleanup
		(gameContainerRef.current as any).slingshotElements = slingshotElements;

		// Create structures and pigs
		const structures = createStructures();
		const pigs = createPigs();
		pigsRef.current = pigs;

		// Add physics bodies to world (no slingshot bodies)
		Matter.World.add(engine.world, [
			ground,
			...structures.map((s) => s.body),
			...pigs.map((p) => p.body),
		]);

		gameElementsRef.current.push(...structures, ...pigs);
	};

	const createStructures = (): GameElement[] => {
		const structures: GameElement[] = [];

		// Create a very stable pyramid-like structure
		const blockConfigs = [
			// Heavy foundation base - very wide and heavy
			{
				x: 600,
				y: CANVAS_HEIGHT - 40,
				w: 120,
				h: 30,
				img: "/game/base/long_rectange_plank.png",
				density: 0.01,
			},
			{
				x: 720,
				y: CANVAS_HEIGHT - 40,
				w: 120,
				h: 30,
				img: "/game/base/long_rectange_plank.png",
				density: 0.01,
			},
			{
				x: 840,
				y: CANVAS_HEIGHT - 40,
				w: 120,
				h: 30,
				img: "/game/base/long_rectange_plank.png",
				density: 0.01,
			},

			// First level - very thick supports with high mass
			{
				x: 580,
				y: CANVAS_HEIGHT - 85,
				w: 30,
				h: 70,
				img: "/game/base/simple_rectangle_block.png",
				density: 0.008,
			},
			{
				x: 660,
				y: CANVAS_HEIGHT - 85,
				w: 30,
				h: 70,
				img: "/game/base/simple_rectangle_block.png",
				density: 0.008,
			},
			{
				x: 740,
				y: CANVAS_HEIGHT - 85,
				w: 30,
				h: 70,
				img: "/game/base/simple_rectangle_block.png",
				density: 0.008,
			},
			{
				x: 820,
				y: CANVAS_HEIGHT - 85,
				w: 30,
				h: 70,
				img: "/game/base/simple_rectangle_block.png",
				density: 0.008,
			},
			{
				x: 900,
				y: CANVAS_HEIGHT - 85,
				w: 30,
				h: 70,
				img: "/game/base/simple_rectangle_block.png",
				density: 0.008,
			},

			// First level platform - overlapping for stability
			{
				x: 650,
				y: CANVAS_HEIGHT - 125,
				w: 140,
				h: 25,
				img: "/game/base/long_rectange_plank.png",
				density: 0.006,
			},
			{
				x: 790,
				y: CANVAS_HEIGHT - 125,
				w: 140,
				h: 25,
				img: "/game/base/long_rectange_plank.png",
				density: 0.006,
			},

			// Second level - fewer, thicker supports
			{
				x: 680,
				y: CANVAS_HEIGHT - 170,
				w: 25,
				h: 70,
				img: "/game/base/simple_rectangle_block.png",
				density: 0.005,
			},
			{
				x: 760,
				y: CANVAS_HEIGHT - 170,
				w: 25,
				h: 70,
				img: "/game/base/simple_rectangle_block.png",
				density: 0.005,
			},

			// Top platform - smaller and lighter
			{
				x: 720,
				y: CANVAS_HEIGHT - 210,
				w: 80,
				h: 20,
				img: "/game/base/long_rectange_plank.png",
				density: 0.003,
			},
		];

		blockConfigs.forEach((config) => {
			const body = Matter.Bodies.rectangle(
				config.x,
				config.y,
				config.w,
				config.h,
				{
					label: "block",
					density: config.density,
					frictionAir: 0.05,
					friction: 1.0,
					restitution: 0.1,
					frictionStatic: 1.0,
				},
			);

			const element = createElement("img", "pointer-events-none", config.img);
			element.style.width = `${config.w}px`;
			element.style.height = `${config.h}px`;

			gameContainerRef.current?.appendChild(element);

			const gameElement: GameElement = { body, element, type: "block" };
			structures.push(gameElement);
		});

		return structures;
	};

	const createPigs = (): GameElement[] => {
		const pigs: GameElement[] = [];

		// Place pigs strategically in the stable structure with health
		const pigConfigs = [
			{ x: 620, y: CANVAS_HEIGHT - 75, health: 2 }, // Ground level left
			{ x: 820, y: CANVAS_HEIGHT - 75, health: 2 }, // Ground level right
			{ x: 720, y: CANVAS_HEIGHT - 155, health: 3 }, // First platform center (harder to reach)
			{ x: 720, y: CANVAS_HEIGHT - 235, health: 3 }, // Top platform (hardest to reach)
		];

		pigConfigs.forEach((config) => {
			const body = Matter.Bodies.circle(config.x, config.y, 16, {
				label: "pig",
				density: 0.001,
				frictionAir: 0.03,
				friction: 0.9,
				restitution: 0.3,
				frictionStatic: 0.8,
			});

			const element = createElement(
				"img",
				"w-8 h-8 pointer-events-none",
				"/game/pig.png",
			);
			element.style.zIndex = "30"; // Ensure pigs are visible

			// Create health bar container (hidden)
			const healthBarContainer = createElement(
				"div",
				"absolute pointer-events-none",
			);
			healthBarContainer.style.width = "24px";
			healthBarContainer.style.height = "4px";
			healthBarContainer.style.backgroundColor = "rgba(0,0,0,0.5)";
			healthBarContainer.style.borderRadius = "2px";
			healthBarContainer.style.border = "1px solid white";
			healthBarContainer.style.zIndex = "35";
			healthBarContainer.style.display = "none"; // Hide health bar

			// Create health bar fill
			const healthBar = createElement("div", "absolute pointer-events-none");
			healthBar.style.width = "100%";
			healthBar.style.height = "100%";
			healthBar.style.backgroundColor =
				config.health === 3 ? "#ff4444" : "#ff6666";
			healthBar.style.borderRadius = "1px";
			healthBar.style.transition = "width 0.3s ease";

			healthBarContainer.appendChild(healthBar);

			gameContainerRef.current?.appendChild(element);
			gameContainerRef.current?.appendChild(healthBarContainer);

			const gameElement: GameElement = {
				body,
				element,
				type: "pig",
				health: config.health,
				maxHealth: config.health,
			};

			// Store health bar reference on the element for easy access
			(gameElement as any).healthBarContainer = healthBarContainer;
			(gameElement as any).healthBar = healthBar;

			pigs.push(gameElement);
		});

		return pigs;
	};

	const createBird = () => {
		if (!engineRef.current || !gameContainerRef.current) return;

		// Make sure no bird already exists
		if (currentBirdRef.current) {
			console.log("Bird already exists, not creating new one");
			return;
		}

		console.log(
			"Creating bird type:",
			currentBirdType,
			"Birds remaining:",
			gameState.birdsRemaining,
		);

		const birdType = BIRD_TYPES[currentBirdType];
		const startX = SLINGSHOT_X;
		const startY = SLINGSHOT_Y - 80; // Bird much higher than slingshot

		const body = Matter.Bodies.circle(startX, startY, 15, {
			label: "bird",
			frictionAir: 0.05,
			density: 0.002,
			restitution: 0.3,
		});

		const element = createElement(
			"img",
			"w-8 h-8 pointer-events-none cursor-grab",
			birdType.src,
		);
		element.style.zIndex = "25";
		element.style.position = "absolute";
		element.style.left = `${(startX / CANVAS_WIDTH) * 100}%`;
		element.style.top = `${(startY / CANVAS_HEIGHT) * 100}%`;
		element.style.transform = "translate(-50%, -50%)";
		gameContainerRef.current.appendChild(element);

		const gameElement: GameElement = {
			body,
			element,
			type: "bird",
			birdType: currentBirdType,
		};
		currentBirdRef.current = gameElement;
		gameElementsRef.current.push(gameElement);

		Matter.World.add(engineRef.current.world, body);

		// Create slingshot constraint
		const constraint = Matter.Constraint.create({
			bodyA: body,
			pointB: { x: SLINGSHOT_X, y: SLINGSHOT_Y - 80 },
			stiffness: 0.02,
			length: 0,
			damping: 0.1,
		});

		slingshotConstraintRef.current = constraint;
		Matter.World.add(engineRef.current.world, constraint);

		console.log("Bird created at:", startX, startY, "with constraint");
	};

	const startAnimationLoop = () => {
		const animate = () => {
			// Update all visual elements to match physics bodies
			gameElementsRef.current.forEach((gameElement) => {
				updateElementPosition(gameElement);
			});

			if (currentBirdRef.current) {
				updateElementPosition(currentBirdRef.current);
			}

			// Clean up old launched birds that are completely stopped and off screen
			gameElementsRef.current = gameElementsRef.current.filter(
				(gameElement) => {
					if (
						gameElement.type === "bird" &&
						gameElement !== currentBirdRef.current
					) {
						const velocity = Math.sqrt(
							(gameElement.body.velocity?.x || 0) ** 2 +
								(gameElement.body.velocity?.y || 0) ** 2,
						);

						// Don't clean up birds too quickly - give them at least 5 seconds to fly
						const launchTime = (gameElement as any).launchTime || 0;
						const timeSinceLaunch = Date.now() - launchTime;
						if (timeSinceLaunch < 5000) {
							return true; // Keep bird for at least 5 seconds
						}

						// Only remove bird if it's way off screen or deep underground
						const isWayOffScreen =
							gameElement.body.position.x > CANVAS_WIDTH + 300;
						const isDeepUnderground =
							gameElement.body.position.y > CANVAS_HEIGHT + 200;
						const isCompletelyStill =
							velocity < 0.02 &&
							gameElement.body.position.y >= CANVAS_HEIGHT - 30;

						if (
							(isCompletelyStill && timeSinceLaunch > 8000) ||
							isWayOffScreen ||
							isDeepUnderground
						) {
							console.log(
								"Removing stopped bird at:",
								gameElement.body.position.x,
								gameElement.body.position.y,
								"velocity:",
								velocity,
								"time since launch:",
								timeSinceLaunch,
							);
							if (engineRef.current) {
								Matter.World.remove(engineRef.current.world, gameElement.body);
							}
							if (gameElement.element && gameElement.element.parentNode) {
								gameElement.element.remove();
							}
							return false; // Remove from array
						}
					}
					return true; // Keep in array
				},
			);

			animationFrameRef.current = requestAnimationFrame(animate);
		};
		animate();
	};

	const handleCollisions = (event: Matter.IEventCollision<Matter.Engine>) => {
		event.pairs.forEach((pair) => {
			const { bodyA, bodyB } = pair;

			// Debug collision detection
			if (bodyA.label === "bird" || bodyB.label === "bird") {
				console.log("Bird collision detected:", bodyA.label, "vs", bodyB.label);

				// Ignore slingshot collisions entirely
				if (bodyA.label === "slingshot" || bodyB.label === "slingshot") {
					console.log("Ignoring slingshot collision");
					return;
				}
			}

			// Check if pig is involved in collision
			if (bodyA.label === "pig" || bodyB.label === "pig") {
				const pigBody = bodyA.label === "pig" ? bodyA : bodyB;
				const attackerBody = bodyA.label === "pig" ? bodyB : bodyA;
				const pigElement = pigsRef.current.find((p) => p.body === pigBody);

				if (
					pigElement &&
					engineRef.current &&
					typeof pigElement.health === "number"
				) {
					let damage = 0;

					// Simple damage system
					if (attackerBody.label === "bird") {
						damage = 2; // Birds always do 2 damage
					} else if (attackerBody.label === "block") {
						damage = 1; // Blocks do 1 damage
					}

					// Apply damage with cooldown
					if (damage > 0) {
						const currentTime = Date.now();
						const timeSinceLastDamage =
							currentTime - (pigElement.lastDamageTime || 0);

						if (attackerBody.label === "bird" || timeSinceLastDamage > 500) {
							pigElement.health = Math.max(0, pigElement.health - damage);
							pigElement.lastDamageTime = currentTime;

							// Update health bar
							const healthBar = (pigElement as any).healthBar;
							if (healthBar && pigElement.maxHealth) {
								const healthPercent =
									(pigElement.health / pigElement.maxHealth) * 100;
								healthBar.style.width = `${healthPercent}%`;

								if (healthPercent > 66) {
									healthBar.style.backgroundColor = "#44ff44";
								} else if (healthPercent > 33) {
									healthBar.style.backgroundColor = "#ffff44";
								} else {
									healthBar.style.backgroundColor = "#ff4444";
								}
							}

							// Visual effects
							createImpactEffect(pigBody.position.x, pigBody.position.y, "hit");
							pigElement.element.style.filter = "brightness(1.8) saturate(2)";
							pigElement.element.style.transform += " scale(1.2)";

							setTimeout(() => {
								if (pigElement.element) {
									pigElement.element.style.filter = "none";
									pigElement.element.style.transform =
										pigElement.element.style.transform.replace(
											/ scale\([^)]*\)/g,
											"",
										);
								}
							}, 300);

							// Remove pig if health reaches 0
							if (pigElement.health <= 0) {
								createImpactEffect(
									pigBody.position.x,
									pigBody.position.y,
									"destroy",
								);

								Matter.World.remove(engineRef.current.world, pigBody);

								pigElement.element.style.transition = "all 0.5s ease-out";
								pigElement.element.style.transform +=
									" scale(0) rotate(360deg)";
								pigElement.element.style.opacity = "0";

								setTimeout(() => {
									pigElement.element.remove();
								}, 500);

								const healthBarContainer = (pigElement as any)
									.healthBarContainer;
								if (healthBarContainer) {
									healthBarContainer.style.transition = "opacity 0.3s ease-out";
									healthBarContainer.style.opacity = "0";
									setTimeout(() => healthBarContainer.remove(), 300);
								}

								pigsRef.current = pigsRef.current.filter(
									(p) => p !== pigElement,
								);
								gameElementsRef.current = gameElementsRef.current.filter(
									(g) => g !== pigElement,
								);

								if (pigsRef.current.length === 0) {
									setTimeout(() => {
										setGameState((prev) => ({
											...prev,
											gameOver: true,
											won: true,
										}));
									}, 1000);
								}
							}
						}
					}
				}
			}
		});
	};

	const checkGameEnd = () => {
		setTimeout(() => {
			if (pigsRef.current.length > 0) {
				setGameState((prev) => ({ ...prev, gameOver: true, won: false }));
			}
		}, 1000);
	};

	const startGame = () => {
		setGameState({
			isRunning: true,
			birdsRemaining: 3,
			gameOver: false,
			won: false,
		});
		setCurrentBirdType(0);
		initializeGame();
	};

	const cleanup = () => {
		console.log("Cleaning up game...");

		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
		}

		// Remove slingshot constraint first
		if (slingshotConstraintRef.current && engineRef.current) {
			Matter.World.remove(
				engineRef.current.world,
				slingshotConstraintRef.current,
			);
			slingshotConstraintRef.current = null;
		}

		// Remove current bird from physics world
		if (currentBirdRef.current && engineRef.current) {
			Matter.World.remove(engineRef.current.world, currentBirdRef.current.body);
		}

		// Remove all game elements from physics world
		gameElementsRef.current.forEach((gameElement) => {
			if (engineRef.current) {
				Matter.World.remove(engineRef.current.world, gameElement.body);
			}
		});

		if (runnerRef.current && engineRef.current) {
			Matter.Runner.stop(runnerRef.current);
		}

		if (renderRef.current) {
			Matter.Render.stop(renderRef.current);
		}

		if (engineRef.current) {
			Matter.Engine.clear(engineRef.current);
		}

		// Clean up DOM elements
		gameElementsRef.current.forEach((gameElement) => {
			if (gameElement.element && gameElement.element.parentNode) {
				gameElement.element.remove();
			}
			// Remove health bars for pigs
			if (
				gameElement.type === "pig" &&
				(gameElement as any).healthBarContainer
			) {
				const healthBar = (gameElement as any).healthBarContainer;
				if (healthBar && healthBar.parentNode) {
					healthBar.remove();
				}
			}
		});

		// Clean up slingshot visual elements
		if (
			gameContainerRef.current &&
			(gameContainerRef.current as any).slingshotElements
		) {
			(gameContainerRef.current as any).slingshotElements.forEach(
				(slingshot: any) => {
					if (slingshot.element && slingshot.element.parentNode) {
						slingshot.element.remove();
					}
				},
			);
			(gameContainerRef.current as any).slingshotElements = null;
		}

		if (
			currentBirdRef.current &&
			currentBirdRef.current.element &&
			currentBirdRef.current.element.parentNode
		) {
			currentBirdRef.current.element.remove();
		}

		// Clear all references
		gameElementsRef.current = [];
		pigsRef.current = [];
		currentBirdRef.current = null;
		slingshotConstraintRef.current = null;

		// Clear impact effects
		setImpactEffects([]);
		impactEffectsRef.current = [];
	};

	const resetGame = () => {
		cleanup();
		setGameState({
			isRunning: false,
			birdsRemaining: 3,
			gameOver: false,
			won: false,
		});
		setIsDragging(false);
	};

	useEffect(() => {
		return () => {
			cleanup();
		};
	}, []);

	return (
		<div className="bg-blue-900/20 rounded-lg p-6 border-2 border-blue-500/50 mt-8 relative z-10">
			<div className="text-center mb-4">
				<h3 className="text-2xl font-bold text-blue-300 mb-4">
					Angry Birds Slingshot
				</h3>

				<div className="flex justify-center items-center mb-4">
					<span className="text-white font-bold font-angry text-lg">
						Birds Remaining: {gameState.birdsRemaining}
					</span>
				</div>

				<div className="flex justify-center mb-4">
					{!gameState.isRunning && !gameState.gameOver && (
						<button
							type="button"
							onClick={startGame}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-angry font-bold"
						>
							Start Game
						</button>
					)}
					{gameState.isRunning && (
						<button
							type="button"
							onClick={resetGame}
							className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-angry font-bold"
						>
							Reset Game
						</button>
					)}
					{gameState.gameOver && (
						<button
							type="button"
							onClick={startGame}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-angry font-bold"
						>
							Play Again
						</button>
					)}
				</div>
			</div>

			<div className="relative mx-auto border-2 border-blue-400/50 rounded-lg overflow-hidden w-full max-w-4xl">
				{/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
				<div
					ref={gameContainerRef}
					className="w-full h-96 bg-cover bg-center cursor-crosshair relative select-none z-20"
					style={{
						backgroundImage: "url(/game/game_stage.png)",
						backgroundSize: "cover",
					}}
					onMouseDown={(e) => {
						console.log("Container mouse down detected");
						if (
							!currentBirdRef.current ||
							!engineRef.current ||
							!gameState.isRunning ||
							isDragging
						) {
							console.log(
								"No bird or engine or game not running or already dragging",
							);
							return;
						}

						// Only allow interaction with birds that have slingshot constraints
						if (!slingshotConstraintRef.current) {
							console.log("No slingshot constraint - bird already launched");
							return;
						}

						const rect = gameContainerRef.current?.getBoundingClientRect();
						const mouseX =
							((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
						const mouseY =
							((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

						const bird = currentBirdRef.current.body;
						const distance = Math.sqrt(
							(mouseX - bird.position.x) ** 2 + (mouseY - bird.position.y) ** 2,
						);

						console.log("Mouse position:", mouseX, mouseY);
						console.log("Bird position:", bird.position.x, bird.position.y);
						console.log("Distance to bird:", distance);

						if (distance < 50) {
							console.log("Starting drag");
							setIsDragging(true);
							// Make bird static while dragging
							Matter.Body.setStatic(bird, true);
						}
					}}
					onMouseMove={(e) => {
						if (!isDragging || !currentBirdRef.current || !engineRef.current)
							return;

						const rect = gameContainerRef.current?.getBoundingClientRect();
						const mouseX =
							((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
						const mouseY =
							((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

						// Limit drag distance
						const maxDistance = 120;
						const dx = mouseX - SLINGSHOT_X;
						const dy = mouseY - (SLINGSHOT_Y - 80);
						const distance = Math.sqrt(dx * dx + dy * dy);

						let newX = mouseX;
						let newY = mouseY;

						if (distance > maxDistance) {
							const angle = Math.atan2(dy, dx);
							newX = SLINGSHOT_X + Math.cos(angle) * maxDistance;
							newY = SLINGSHOT_Y - 80 + Math.sin(angle) * maxDistance;
						}

						// Only allow pulling back (to the left of slingshot)
						if (newX > SLINGSHOT_X + 10) {
							newX = SLINGSHOT_X + 10;
						}

						// Update physics body position
						Matter.Body.setPosition(currentBirdRef.current.body, {
							x: newX,
							y: newY,
						});

						// Force immediate visual update to sync with mouse
						const scaleX = rect.width / CANVAS_WIDTH;
						const scaleY = rect.height / CANVAS_HEIGHT;
						currentBirdRef.current.element.style.left = `${newX * scaleX}px`;
						currentBirdRef.current.element.style.top = `${newY * scaleY}px`;
					}}
					onMouseUp={() => {
						if (
							!isDragging ||
							!currentBirdRef.current ||
							!engineRef.current ||
							!slingshotConstraintRef.current
						)
							return;

						console.log("Mouse up - launching bird");
						setIsDragging(false);

						const bird = currentBirdRef.current.body;

						// Make bird dynamic again
						Matter.Body.setStatic(bird, false);

						const dx = SLINGSHOT_X - bird.position.x;
						const dy = SLINGSHOT_Y - 80 - bird.position.y;
						const force = BIRD_TYPES[currentBirdType].power;

						console.log("Launch force:", dx * 0.01 * force, dy * 0.01 * force);
						console.log(
							"Bird position before launch:",
							bird.position.x,
							bird.position.y,
						);

						// Apply launch force
						Matter.Body.applyForce(bird, bird.position, {
							x: dx * 0.01 * force,
							y: dy * 0.01 * force,
						});

						console.log(
							"Bird velocity after launch:",
							bird.velocity.x,
							bird.velocity.y,
						);

						// Remove slingshot constraint
						if (slingshotConstraintRef.current) {
							Matter.World.remove(
								engineRef.current.world,
								slingshotConstraintRef.current,
							);
							slingshotConstraintRef.current = null;
						}

						// Keep reference to launched bird but clear current bird reference
						const launchedBird = currentBirdRef.current;
						currentBirdRef.current = null;

						// Mark the launched bird so we don't clean it up too early
						if (launchedBird) {
							(launchedBird as any).isLaunched = true;
							(launchedBird as any).launchTime = Date.now();
						}

						// Create next bird after delay or end game
						setTimeout(() => {
							setGameState((prev) => {
								const newBirdsRemaining = prev.birdsRemaining - 1;
								console.log(
									"Birds remaining after this shot:",
									newBirdsRemaining,
								);

								if (newBirdsRemaining > 0) {
									setCurrentBirdType(
										(prevType) => (prevType + 1) % BIRD_TYPES.length,
									);
									createBird();
								} else {
									checkGameEnd();
								}

								return {
									...prev,
									birdsRemaining: newBirdsRemaining,
								};
							});
						}, 3000);
					}}
				>
					{/* Hidden canvas for physics debugging */}
					<canvas
						ref={canvasRef}
						className="absolute inset-0 opacity-0 pointer-events-none"
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
					/>

					{/* Slingshot line when dragging */}
					{isDragging && currentBirdRef.current && (
						<svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
							<title>Slingshot Band</title>
							<line
								x1={`${(SLINGSHOT_X / CANVAS_WIDTH) * 100}%`}
								y1={`${((SLINGSHOT_Y - 50) / CANVAS_HEIGHT) * 100}%`}
								x2={`${(currentBirdRef.current.body.position.x / CANVAS_WIDTH) * 100}%`}
								y2={`${(currentBirdRef.current.body.position.y / CANVAS_HEIGHT) * 100}%`}
								stroke="#654321"
								strokeWidth="3"
							/>
						</svg>
					)}

					{!gameState.isRunning && !gameState.gameOver && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
							<div className="text-center text-white border-2 border-blue-400 bg-blue-900/50 p-4 rounded">
								<p className="text-xl font-bold mb-2">Ready to Launch Birds!</p>
								<p className="text-sm">
									Drag the bird back and release to launch at the pigs
								</p>
							</div>
						</div>
					)}

					{gameState.gameOver && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
							<div className="text-center text-white border-2 border-blue-400 bg-blue-900/50 p-4 rounded">
								<p className="text-2xl font-bold mb-2">
									{gameState.won ? "Victory!" : "Game Over!"}
								</p>
								<p className="text-sm">
									{gameState.won
										? "All pigs defeated! Great shooting!"
										: "Better luck next time, try again!"}
								</p>
							</div>
						</div>
					)}

					{isDragging && (
						<div className="absolute top-4 left-4 text-white bg-black/50 px-2 py-1 rounded z-30">
							<p className="text-sm">Pull back and release to launch!</p>
						</div>
					)}

					{gameState.isRunning && !isDragging && currentBirdRef.current && (
						<div className="absolute top-4 left-4 text-white bg-black/50 px-2 py-1 rounded z-30">
							<p className="text-sm">Click and drag the bird to aim!</p>
						</div>
					)}

					{/* Impact Effects */}
					{impactEffects.map((effect) => (
						<div
							key={effect.id}
							className={`absolute pointer-events-none z-50 ${
								effect.type === "hit"
									? "animate-ping"
									: effect.type === "destroy"
										? "animate-bounce"
										: "animate-pulse"
							}`}
							style={{
								left: `${(effect.x / CANVAS_WIDTH) * 100}%`,
								top: `${(effect.y / CANVAS_HEIGHT) * 100}%`,
								transform: "translate(-50%, -50%)",
								animation:
									effect.type === "destroy"
										? "explosion 1s ease-out forwards"
										: "impact 0.5s ease-out forwards",
							}}
						>
							{effect.type === "hit" && (
								<div className="w-8 h-8 bg-yellow-400 rounded-full opacity-80 animate-ping" />
							)}
							{effect.type === "destroy" && (
								<div className="relative">
									<div className="w-12 h-12 bg-red-500 rounded-full opacity-90 animate-ping" />
									<div className="absolute inset-0 w-12 h-12 bg-orange-400 rounded-full opacity-70 animate-bounce" />
									<div className="absolute inset-2 w-8 h-8 bg-yellow-300 rounded-full opacity-60 animate-pulse" />
								</div>
							)}
							{effect.type === "bounce" && (
								<div className="w-6 h-6 bg-blue-400 rounded-full opacity-60 animate-pulse" />
							)}
						</div>
					))}
				</div>
			</div>

			<div className="text-center mt-4">
				<p className="text-sm text-blue-200">
					Drag the bird back in the slingshot and release to launch it at the
					green pigs!
				</p>
			</div>

			{/* Custom CSS for impact animations */}
			<style>{`
				@keyframes impact {
					0% { 
						transform: translate(-50%, -50%) scale(0.5);
						opacity: 1;
					}
					50% { 
						transform: translate(-50%, -50%) scale(1.2);
						opacity: 0.8;
					}
					100% { 
						transform: translate(-50%, -50%) scale(2);
						opacity: 0;
					}
				}
				
				@keyframes explosion {
					0% { 
						transform: translate(-50%, -50%) scale(0.3);
						opacity: 1;
					}
					30% { 
						transform: translate(-50%, -50%) scale(1.5);
						opacity: 0.9;
					}
					70% { 
						transform: translate(-50%, -50%) scale(2.2);
						opacity: 0.5;
					}
					100% { 
						transform: translate(-50%, -50%) scale(3);
						opacity: 0;
					}
				}
				
				@keyframes damageFloat {
					0% { 
						transform: translate(-50%, -50%) scale(1);
						opacity: 1;
					}
					50% { 
						transform: translate(-50%, -80%) scale(1.2);
						opacity: 0.8;
					}
					100% { 
						transform: translate(-50%, -120%) scale(0.8);
						opacity: 0;
					}
				}
			`}</style>
		</div>
	);
}
