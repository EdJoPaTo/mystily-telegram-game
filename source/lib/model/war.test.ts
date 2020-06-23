import test, {ExecutionContext} from 'ava'

import {MINUTE} from '../unix-time'

import {calculateBattleFatigue} from './war'

function calculateBattleFatigueMacro(t: ExecutionContext, currentFatigueMinutes: number, expectedCooldownMinutes: number, expectedFatigueMinutesAfterCooldownIsPassed: number): void {
	const {cooldownSeconds, newFatigueSeconds} = calculateBattleFatigue(currentFatigueMinutes * MINUTE)
	const fatigueAfterCooldownPassed = newFatigueSeconds - cooldownSeconds
	t.is(cooldownSeconds / MINUTE, expectedCooldownMinutes, 'expectedCooldown wrong')
	t.is(fatigueAfterCooldownPassed / MINUTE, expectedFatigueMinutesAfterCooldownIsPassed, 'expectedFatigueAfterCooldownIsPassed wrong')
}

calculateBattleFatigueMacro.title = (_title: string, ...args: number[]) => {
	return 'calculateNewFatigueMacro ' + args.join(' ')
}

test(calculateBattleFatigueMacro, 0, 2, 6)
test(calculateBattleFatigueMacro, 0.2, 2, 6)
test(calculateBattleFatigueMacro, 0.5, 2, 6)
test(calculateBattleFatigueMacro, 1, 2, 6)
test(calculateBattleFatigueMacro, 2, 2, 6)
test(calculateBattleFatigueMacro, 3, 3, 9)
test(calculateBattleFatigueMacro, 4, 4, 12)
test(calculateBattleFatigueMacro, 5, 5, 15)
test(calculateBattleFatigueMacro, 6, 6, 18)
test(calculateBattleFatigueMacro, 7, 7, 21)
test(calculateBattleFatigueMacro, 8, 8, 24)
test(calculateBattleFatigueMacro, 9, 9, 27)
test(calculateBattleFatigueMacro, 10, 10, 30)
