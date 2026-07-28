import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';

declare module 'mineflayer' {
    interface Bot {
        cicerone: {
            settings: CiceroneSettings;
            actionRegistry: ActionRegistry;
            structureRegistry: PathStructureRegistry;
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
    constructor(options?: {
        buildingBlocks?: string[];
        movementTimeoutMs?: number;
        movementPrecision?: number;
        buildUpThreshold?: number;
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
}

export class PathElement {
    position: Vec3;
    type: string;
    constructor(position: Vec3, type: string);
    getInfo(): string;
    resolve(actionRegistry: ActionRegistry): Promise<void>;
    revert(actionRegistry: ActionRegistry): Promise<void>;
}

export class ParentPathElement extends PathElement {
    children: PathElement[];
    constructor(position: Vec3, type: string);
    addChild(child: PathElement): void;
    hasChildren(): boolean;
}

export class ActionRegistry {
    constructor();
    register(
        type: string,
        resolveHandler: (position: Vec3) => Promise<void>,
        revertHandler?: (position: Vec3) => Promise<void>,
    ): void;
    unregister(type: string): boolean;
    has(type: string): boolean;
    list(): string[];
    resolve(type: string, position: Vec3): Promise<void>;
    revert(type: string, position: Vec3): Promise<void>;
}

export interface StructureDescriptor {
    createsNewStandPoint: boolean;
    standOffset: Vec3 | null;
    relativeToLastParent: boolean;
    standPointType: string | null;
    attachAsChildOfNewStandPoint: boolean;
}

export class PathStructureRegistry {
    constructor();
    register(type: string, descriptor: Partial<StructureDescriptor>): void;
    unregister(type: string): boolean;
    get(type: string): StructureDescriptor;
    has(type: string): boolean;
}

export class Path {
    pathElements: ParentPathElement[];
    lastPathElement: ParentPathElement;
    constructor(
        startPosition: Vec3,
        actionRegistry: ActionRegistry,
        structureRegistry: PathStructureRegistry,
    );
    add(position: Vec3, type: string): this;
    reset(startPosition: Vec3): void;
    resolve(): Promise<void>;
    revert(): Promise<void>;
    clone(): Path;
    toJSON(): ParentPathElement[];
    static fromJSON(
        json: any,
        actionRegistry: ActionRegistry,
        structureRegistry: PathStructureRegistry,
    ): Path;
}

export default function plugin(bot: Bot, options?: any): void;
