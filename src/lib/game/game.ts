import {
    Engine,
    Render,
    Runner,
    MouseConstraint,
    Mouse,
    Composite,
    Bodies,
    type Body,
    type World,
} from "matter-js";
import { loadTextures, type TextureInfo } from "./loader";

class Game {
    $engine: Engine;
    $world: World;
    $render: Render;
    $runner: Runner;

    $container: HTMLElement;
    $width!: number;
    $height!: number;

    $updateDimensions() {
        this.$width = this.$container.clientWidth;
        this.$height = this.$container.clientHeight;
    }

    constructor(element: HTMLElement) {
        this.$container = element;
        this.$updateDimensions();

        // create an engine
        this.$engine = Engine.create();
        this.$world = this.$engine.world;

        // create a renderer
        this.$render = Render.create({
            element: element,
            engine: this.$engine,
            options: {
                width: this.$width,
                height: this.$height,
                wireframes: false,
                background: "transparent",
            }
        });

        this.$setupMouse();

        this.$runner = Runner.create();
    }

    run() {
        this.resize(true);
        // start renderer and runner
        Render.run(this.$render);
        Runner.run(this.$runner, this.$engine);
        this.$createObjects();

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    paused = false;

    pause() {
        if (this.paused) return;
        this.paused = true;
        Runner.stop(this.$runner);
    }

    resume() {
        if (!this.paused) return;
        this.paused = false;
        Runner.run(this.$runner, this.$engine);
    }

    $walls: {
        top?: Body
        bottom?: Body,
        left?: Body,
        right?: Body,
    } = {};

    $updateWalls() {
        const thickness = 150;
        const padding = 5;
        const offset = thickness / 2 - padding;

        // Remove existing walls
        for (const key in this.$walls) {
            const wall = this.$walls[key as keyof typeof this.$walls];
            if (wall) {
                Composite.remove(this.$world, wall);
            }
        }

        // Create new walls

        this.$walls.top = Bodies.rectangle(
            this.$width / 2,
            -offset,
            this.$width,
            thickness,
            { isStatic: true, render: { visible: false, } },
        );
        this.$walls.bottom = Bodies.rectangle(this.$width / 2, this.$height + offset, this.$width, thickness, { isStatic: true },);
        this.$walls.bottom = Bodies.rectangle(this.$width / 2, this.$height + offset, this.$width, thickness, { isStatic: true, render: { visible: false } },);
        this.$walls.left = Bodies.rectangle(-offset, this.$height / 2, thickness, this.$height, { isStatic: true, render: { visible: false } },);
        this.$walls.right = Bodies.rectangle(this.$width + offset, this.$height / 2, thickness, this.$height, { isStatic: true, render: { visible: false } },);

        // Add new walls to the world
        Composite.add(this.$world, [
            this.$walls.top,
            this.$walls.bottom,
            this.$walls.left,
            this.$walls.right,
        ]);
    }

    $mouse!: Mouse;

    $setupMouse() {
        this.$mouse = Mouse.create(this.$render.canvas);

        const enableMouse = () => {
            if ((this.$render as any)._mouseEnabled) return;
            const mouseConstraint = MouseConstraint.create(this.$engine, {
                mouse: this.$mouse,
                constraint: { stiffness: 0.2, render: { visible: false } },
            });
            Composite.add(this.$world, mouseConstraint);
            this.$render.mouse = this.$mouse;
            (this.$render as any)._mouseEnabled = true;


            // safely remove legacy mousewheel listeners if present (guarded to satisfy TS)
            const mw = (mouseConstraint.mouse as unknown as { mousewheel?: EventListener }).mousewheel;
            const el = mouseConstraint.mouse.element as Element | null;
            if (el && mw) {
                try {
                    el.removeEventListener("mousewheel", mw);
                } catch {
                    /* ignore */
                }
                try {
                    el.removeEventListener("DOMMouseScroll", mw);
                } catch {
                    /* ignore */
                }
            }
        };

        // Enable on first pointer interaction
        this.$render.canvas.addEventListener("pointerdown", enableMouse, { once: true });

    }

    resize(force: boolean = false) {
        const prevW = this.$width;
        const prevH = this.$height;
        this.$updateDimensions();

        if (!force && prevW === this.$width && prevH === this.$height) return;

        this.$render.canvas.width = this.$width;
        this.$render.canvas.height = this.$height;
        this.$updateWalls();
    }

    $createBird(x: number, y: number, radius: number, texture: TextureInfo, scale = 1) {
        const diameter = radius * 2;
        const maxDimension = Math.max(texture.width, texture.height);
        const spriteScale = (diameter / maxDimension) * scale;

        return Bodies.circle(x, y, radius, {
            render: {
                sprite: {
                    texture: texture.src,
                    xScale: spriteScale,
                    yScale: spriteScale,
                },
            },
        });
    }

    async $createObjects() {
        const texturePaths = {
            red: "/assets/svg/red.svg",
            chuck: "/assets/svg/chuck.svg",
            blue_1: "/assets/svg/blue_1.svg",
            blue_2: "/assets/svg/blue_2.svg",
            blue_3: "/assets/svg/blue_3.svg",
            bomb: "/assets/svg/bomb.svg",
            matilda: "/assets/svg/matilda.svg",
            terence: "/assets/svg/terence.svg",
        };

        const textures = await loadTextures(texturePaths);

        const scale = window.innerWidth < 640 ? 0.6 : 1;

        // Initial light set
        const initial = [
            this.$createBird(this.$width / 2, this.$height - 150, 30 * scale, textures.red, 2),
            this.$createBird(this.$width / 2, this.$height - 150, 27 * scale, textures.chuck, 2),
        ];

        Composite.add(this.$world, initial);

        // Defer heavier bodies until idle
        requestIdleCallback?.(() => {
            const rest = [
                this.$createBird(this.$width / 2, this.$height - 150, 18 * scale, textures.blue_1, 1),
                this.$createBird(this.$width / 2, this.$height - 150, 18 * scale, textures.blue_2, 1),
                this.$createBird(this.$width / 2, this.$height - 150, 18 * scale, textures.blue_3, 1),
                this.$createBird(this.$width / 2, this.$height - 150, 54 * scale, textures.bomb, 2),
                this.$createBird(this.$width / 2, this.$height - 150, 51 * scale, textures.matilda, 2),
                this.$createBird(this.$width / 2, this.$height - 150, 72 * scale, textures.terence, 2),
            ];
            Composite.add(this.$world, rest);
        });
    }
}

export { Game };