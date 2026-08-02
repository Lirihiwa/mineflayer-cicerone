import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';

declare module 'mineflayer' {
    interface Bot {
        cicerone: {
            settings: CiceroneSettings;
            actionRegistry: ActionRegistry;
            createPath(): Path;
            resolve(path: Path): Promise<void>;
            revert(path: Path): Promise<void>;
            pathFromJSON(json: any): Path;
            actions: {
                goto(vec: Vec3, options?: GotoOptions): Promise<void>;
                jumpOn(vec: Vec3, options?: GotoOptions): Promise<void>;
                stopMove(): void;
                digBlock(position: Vec3): Promise<void>;
                placeBuildingBlock(position: Vec3): Promise<void>;
                buildUp(): Promise<void>;
            };
        };
    }
}

export interface GotoOptions {
    precision?: number;
    timeout?: number;
}

export class CiceroneError extends Error {
    constructor(message: string, options?: { cause?: Error });
}

export class CiceroneSettings {
    utils: {
        harvestTool: Function;
        getReferenceBlockAndFaceVector: Function;
        equipBuildingBlock: Function;
    };
    constructor(options?: {
        buildingBlocks?: string[];
        movementTimeoutMs?: number;
        movementPrecision?: number;
        buildUpThreshold?: number;
        minDurability?: number;
    });
    setBuildingBlocks(blocks: string[]): void;
    getBuildingBlocks(): string[];
    requireBuildingBlocks(): string[];
    setMovementTimeoutMs(ms: number): void;
    getMovementTimeoutMs(): number;
    setMovementPrecision(precision: number): void;
    getMovementPrecision(): number;
    setBuildUpThreshold(threshold: number): void;
    getBuildUpThreshold(): number;
    setMinDurability(minDurability: number): void;
    getMinDurability(): number;
}

export class PathElement {
    position: Vec3;
    type: string;
    state: any;
    constructor(position: Vec3, type: string, state?: any);
    getInfo(): string;
    run(actionRegistry: ActionRegistry): Promise<void>;
    reverse(actionRegistry: ActionRegistry): Promise<void>;
}

export class ActionRegistry {
    constructor();
    register(
        type: string,
        runHandler: (position: Vec3, element?: PathElement) => Promise<void>,
        reverseHandler?: (position: Vec3, element?: PathElement) => Promise<void>,
    ): void;
    unregister(type: string): boolean;
    has(type: string): boolean;
    list(): string[];
    run(type: string, position: Vec3, element?: PathElement): Promise<void>;
    reverse(type: string, position: Vec3, element?: PathElement): Promise<void>;
}

export class Path {
    elements: PathElement[];
    constructor(actionRegistry: ActionRegistry);
    add(position: Vec3, type: string): this;
    reset(): void;
    run(): Promise<void>;
    reverse(): Promise<void>;
    clone(): Path;
    toJSON(): PathElement[];
    static fromJSON(json: any, actionRegistry: ActionRegistry): Path;
}

export default function plugin(bot: Bot, options?: any): void;
