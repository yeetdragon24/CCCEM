// types/PForPause.d.ts
declare global {
    namespace Game {
        /**
         * Game.T, but adjusted according to the current time factor such that it is aligned to the in-game time.
         */
        let animT: number;
    }
    export namespace PForPause {
        /**
         * The current multiplier for game speed. A value of 1 is normal speed.
         */
        export let timeFactor: number;
        /**
         * The original frames per second value for the game.
         */
        export let originalFps: number;
        /**
         * The functional frames per second, adjusted by the timeFactor.
         */
        export let fFps: number;
        export let allAnimations: Set<Animation>;
        export let onChangeHooks: Array<() => void>;
        /**
         * The cumulative real time in milliseconds, used for time manipulation.
         */
        export let cumulativeRealTime: number;
        export let lastFrame: number;
        /**
          * Changes the game speed multiplier and updates CSS animation playback rates.
          * @param {number} mult - The new game speed multiplier.
          * @param {boolean} [noCSSUpdates] - If true, skips updating CSS animation playback rates.
         */
        export function changeGameSpeed(mult: number, noCSSUpdates?: boolean): void;
        /**
         * Scales a per-frame probability to maintain a constant rate per unit time, accounting for timeFactor.
         * @param p The base probability per frame.
         * @returns The scaled probability.
         */
        export function scaleProbabilityRate(p: number): number;
        /**
         * Scales a single-frame probability to maintain average time to success constant per unit time.
         * @param p The base probability per frame.
         * @returns The sclaed probability
         */
        export function scaleProbabilitySingle(p: number): number;
        export function hookAnim(anim: Animation): void;
        export function catchAnimationsInNode(node: Node): void;
        export function sweepAnim(): void;
        /**
         * Registers a callback to be called whenever the game speed changes.
         * @param func The callback function.
         */
        export function addGameSpeedHook(func: () => void): void;
        export function changeMinigame(building: string, additionalFunctions: string[], func?: (M: any) => void): void;
        /**
         * Utility for checking if the animation tick counter is a multiple of a given integer.
         * @param int The interval to check.
         * @returns The number of times the interval was crossed since the last tick.
         */
        export function checkAnimTWasAMultipleOf(int: number): number;
        export function save(): string;
        export function load(str: string): void;
    }
}
export { };